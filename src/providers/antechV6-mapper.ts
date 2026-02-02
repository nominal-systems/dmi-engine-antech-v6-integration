import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import {
  Client,
  ClientPayload,
  CreateOrderPayload,
  Identifier,
  isNullOrUndefinedOrEmpty,
  isNumber,
  Order,
  OrderCreatedResponse,
  OrderPatient,
  OrderStatus,
  PimsIdentifiers,
  ReferenceRange,
  ReferenceRangeType,
  Result,
  ResultStatus,
  Service,
  ServiceType,
  TestResultItem,
  TestResultItemInterpretationCode,
  VeterinarianPayload,
} from '@nominal-systems/dmi-engine-common'
import {
  AntechV6AccessToken,
  AntechV6Client,
  AntechV6Doctor,
  AntechV6LabOrderStatus,
  AntechV6LabResultStatus,
  AntechV6OrderStatus,
  AntechV6Pet,
  AntechV6PetSex,
  AntechV6PreOrder,
  AntechV6PreOrderPlacement,
  AntechV6Result,
  AntechV6ResultStatus,
  AntechV6Test,
  AntechV6TestCodeResult,
  AntechV6TestGuide,
  AntechV6UnitCodeResult,
  PersonDetails,
} from '../interfaces/antechV6-api.interface'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { TestResult } from '@nominal-systems/dmi-engine-common/lib/interfaces/provider-service'
import {
  applyTestResultSequencing,
  extractClientFromResult,
  extractOrderTestCodesFromResult,
  extractPatientFromResult,
  extractPetAge,
  extractPetWeight,
  extractVeterinarianFromResult,
  generateClinicAccessionId,
  isOrphanResult,
  mapPatientSex,
  mapTestCodeResultStatus,
} from '../common/utils/mapper-utils'
import { DEFAULT_PET_SPECIES } from '../constants/default-pet-species'
import { DEFAULT_PET_BREED } from '../constants/default-pet-breed'
import { TEST_RESULT_SEQUENCING_MAP } from '../constants/test-result-sequencing-map.constant'
import {
  ANTECH_V6_LEGACY_TEST_RESULTS_FLAG,
  FEATURE_FLAG_PROVIDER,
  type FeatureFlagContext,
  type FeatureFlagProvider,
} from '../feature-flags/feature-flag.interface'

@Injectable()
export class AntechV6Mapper {
  private readonly logger = new Logger(AntechV6Mapper.name)

  constructor(
    @Optional()
    @Inject(FEATURE_FLAG_PROVIDER)
    private readonly featureFlags?: FeatureFlagProvider,
  ) {}

  mapCreateOrderPayload(
    payload: CreateOrderPayload,
    metadata: AntechV6MessageData,
  ): AntechV6PreOrder {
    const clinicId: string = metadata.integrationOptions.clinicId
    const pimsId: string = metadata.providerConfiguration.PimsIdentifier

    return {
      ...this.extractLabId(metadata),
      ...this.extractClinicId(metadata),
      ...this.extractClinicAccessionId(payload, clinicId, pimsId),
      ...this.extractClient(payload.client),
      ...this.extractDoctor(payload.veterinarian),
      ...this.extractPet(payload.patient),
      ...this.extractOrderCodes(payload),
    }
  }

  mapAntechV6PreOrder(
    preOrder: AntechV6PreOrder,
    preOrderPlacement: AntechV6PreOrderPlacement & AntechV6AccessToken,
    metadata: AntechV6MessageData,
  ): OrderCreatedResponse {
    return {
      requisitionId: preOrder.ClinicAccessionID,
      externalId: preOrder.ClinicAccessionID,
      status: OrderStatus.WAITING_FOR_INPUT,
      submissionUri: `${metadata.providerConfiguration.uiBaseUrl}/testGuide?ClinicAccessionID=${preOrder.ClinicAccessionID}&accessToken=${preOrderPlacement.Token}`,
    }
  }

  mapAntechV6Order(order: AntechV6PreOrder): OrderCreatedResponse {
    return {
      requisitionId: order.ClinicAccessionID,
      externalId: order.ClinicAccessionID,
      status: OrderStatus.SUBMITTED,
    }
  }

  mapAntechV6OrderStatus(
    orderStatus: AntechV6LabOrderStatus,
  ): Pick<Order, 'externalId' | 'status' | 'tests' | 'editable'> {
    return {
      externalId: orderStatus.ClinicAccessionID,
      status: this.mapOrderStatus(orderStatus.OrderStatus),
      tests: orderStatus.LabTests.map((test) => {
        return {
          code: test.Mnemonic,
        }
      }),
      editable: false,
    }
  }

  mapAntechV6ResultStatus(
    resultStatus: AntechV6LabResultStatus,
  ): Pick<Order, 'patient' | 'client' | 'veterinarian'> {
    const extractIdentifier = (
      obj: PersonDetails,
      system: string,
    ): { identifier?: Identifier[] } => {
      return obj.Id ? { identifier: [{ system, value: obj.Id }] } : {}
    }
    return {
      patient: {
        name: resultStatus.Pet.Name,
        sex: AntechV6PetSex.UNKNOWN,
        species: String(resultStatus.SpeciesID),
        breed: String(resultStatus.BreedID),
        ...extractIdentifier(resultStatus.Pet, PimsIdentifiers.PatientID),
      },
      client: {
        ...this.extractClientName(resultStatus.Client),
        ...extractIdentifier(resultStatus.Client, PimsIdentifiers.ClientID),
      },
      veterinarian: {
        ...this.extractVeterinarianName(resultStatus.Doctor),
      },
    }
  }

  mapAntechV6TestGuide(testGuide: AntechV6TestGuide): Service[] {
    return testGuide.LabResults.map((test: AntechV6Test) => {
      return {
        code: test.Code,
        name: test.ReportingTitle,
        description: test.ClientFacingDescription,
        category: test.Category,
        type: ServiceType.IN_HOUSE,
        price: test.Price,
        // TODO(gb): is currency always USD?
        currency: 'USD',
        // TODO(gb): map labRequisitionInfo
      }
    })
  }

  mapAntechV6Result(result: AntechV6Result, context?: FeatureFlagContext): Result {
    const mappedResult: Result = {
      id: String(result.ID),
      orderId: result.ClinicAccessionID,
      accession: result.LabAccessionID,
      status: this.extractResultStatus(result),
      testResults: this.extractTestResults(result.UnitCodeResults, context),
    }

    if (isOrphanResult(result)) {
      mappedResult.order = this.extractOrderFromResult(result)
    }

    return mappedResult
  }

  mapAntechV6UnitCodeResult(unitCodeResult: AntechV6UnitCodeResult, index: number): TestResult {
    const testResultItems: TestResultItem[] = unitCodeResult.TestCodeResults
      ? unitCodeResult.TestCodeResults.map((testCodeResult, idx) =>
          this.mapAntechV6TestCodeResult(testCodeResult, idx, unitCodeResult.OrderCode),
        )
      : []

    return {
      seq: index,
      code: unitCodeResult.OrderCode ? unitCodeResult.OrderCode : unitCodeResult.UnitCodeExtID,
      name: unitCodeResult.UnitCodeDisplayName,
      items: testResultItems?.sort((a, b) => {
        return a.seq !== undefined && b.seq !== undefined ? a.seq - b.seq : -1
      }),
    }
  }

  mapAntechV6TestCodeResult(
    testCodeResult: AntechV6TestCodeResult,
    index: number,
    orderCode?: string,
  ): TestResultItem {
    let seq = index
    if (orderCode !== undefined && Object.keys(TEST_RESULT_SEQUENCING_MAP).includes(orderCode)) {
      seq = applyTestResultSequencing(testCodeResult.Test, TEST_RESULT_SEQUENCING_MAP[orderCode])
    }
    return {
      seq,
      code: testCodeResult.TestCodeExtID,
      name: testCodeResult.Test,
      status: mapTestCodeResultStatus(testCodeResult.ResultStatus),
      ...this.extractTestResultValueX(testCodeResult),
      ...this.extractTestResultInterpretation(testCodeResult),
      ...this.extractTestResultReferenceRange(testCodeResult),
      ...this.extractTestResultNotes(testCodeResult),
    }
  }

  private extractLabId(metadata: AntechV6MessageData): Pick<AntechV6PreOrder, 'LabID'> {
    return {
      LabID: parseInt(metadata.integrationOptions.labId),
    }
  }

  private extractClinicId(metadata: AntechV6MessageData): Pick<AntechV6PreOrder, 'ClinicID'> {
    return {
      ClinicID: metadata.integrationOptions.clinicId,
    }
  }

  private extractClinicAccessionId(
    payload: CreateOrderPayload,
    clinicId: string,
    pimsId: string,
  ): Pick<AntechV6PreOrder, 'ClinicAccessionID'> {
    return {
      ClinicAccessionID: !isNullOrUndefinedOrEmpty(payload.requisitionId)
        ? payload.requisitionId
        : generateClinicAccessionId(clinicId, pimsId),
    }
  }

  private extractClient(client: ClientPayload): AntechV6Client {
    return {
      ClientID: this.getIdFromIdentifier(PimsIdentifiers.ClientID, client.identifier) || client.id,
      ClientFirstName: client.firstName ? client.firstName.trim() : '',
      ClientLastName: client.lastName ? client.lastName.trim().slice(0, 20) : '',
      // TODO(gb): extract client address
      // TODO(gb): extract client contact
    }
  }

  private extractDoctor(veterinarian: VeterinarianPayload): AntechV6Doctor {
    return {
      DoctorID:
        this.getIdFromIdentifier(PimsIdentifiers.VeterinarianID, veterinarian.identifier) ||
        veterinarian.id ||
        '',
      DoctorFirstName: veterinarian.firstName ? veterinarian.firstName : '',
      DoctorLastName: veterinarian.lastName,
      // TODO(gb): extract doctor contact
    }
  }

  private extractPet(patient: OrderPatient): AntechV6Pet {
    const petAgeUnits = (process.env.ANTECH_V6_PET_AGE_UNITS as 'Y' | 'M' | 'W' | 'D') || 'Y'
    return {
      PetID: this.getIdFromIdentifier(PimsIdentifiers.PatientID, patient.identifier) || patient.id,
      PetName: patient.name,
      PetSex: mapPatientSex(patient.sex),
      ...extractPetAge(patient.birthdate, petAgeUnits),
      ...extractPetWeight(patient),
      SpeciesID: isNumber(patient.species) ? parseInt(patient.species) : DEFAULT_PET_SPECIES,
      BreedID:
        patient.breed !== undefined && isNumber(patient.breed)
          ? parseInt(patient.breed)
          : DEFAULT_PET_BREED,
    }
  }

  private extractOrderCodes(payload: CreateOrderPayload): Pick<AntechV6PreOrder, 'OrderCodes'> {
    const orderCodes = {}
    if (payload.tests && payload.tests.length > 0) {
      orderCodes['OrderCodes'] = payload.tests.map((test) => test.code)
    }

    return orderCodes
  }

  private getIdFromIdentifier(system: string, identifier?: Identifier[]): string | undefined {
    return identifier && identifier.find((identifier) => identifier.system === system)?.value
  }

  extractResultStatus(result: AntechV6Result): ResultStatus {
    const resultPendingCount = result.PendingTestCount ?? 0
    let resultTotalCount = result.TotalTestCount ?? 0
    const status = ResultStatus.PENDING

    // Filter out completed tests without results
    const filteredUnitCodeResults =
      result.UnitCodeResults?.filter(
        (UnitCodeResult) =>
          UnitCodeResult.ResultStatus?.toString() === 'F' &&
          (!UnitCodeResult.TestCodeResults || UnitCodeResult.TestCodeResults.length === 0),
      ) ?? []

    resultTotalCount -= filteredUnitCodeResults.length

    if (result.Corrected !== undefined && result.Corrected !== '') {
      return ResultStatus.REVISED
    }

    if (resultPendingCount > 0 && resultPendingCount < resultTotalCount) {
      return ResultStatus.PARTIAL
    }

    if (resultPendingCount === 0) {
      return ResultStatus.COMPLETED
    }

    return status
  }

  private extractTestResults(
    unitCodeResults: AntechV6UnitCodeResult[],
    context?: FeatureFlagContext,
  ): TestResult[] {
    const useLegacyTestResults =
      this.featureFlags?.isEnabled(ANTECH_V6_LEGACY_TEST_RESULTS_FLAG, context) ?? false

    this.logger.debug(
      `Feature flag "${ANTECH_V6_LEGACY_TEST_RESULTS_FLAG}" for clinicId=${context?.clinicId}: ${useLegacyTestResults}`,
    )

    if (useLegacyTestResults) {
      return this.extractTestResultsGrouped(unitCodeResults)
    }

    return this.extractTestResultsLegacy(unitCodeResults)
  }

  private extractTestResultsLegacy(unitCodeResults: AntechV6UnitCodeResult[]): TestResult[] {
    return unitCodeResults
      .filter(
        (unitCodeResult) =>
          !(
            unitCodeResult.ResultStatus?.toString() === 'F' &&
            (!unitCodeResult.TestCodeResults || unitCodeResult.TestCodeResults.length === 0)
          ),
      )
      .map(this.mapAntechV6UnitCodeResult, this)
  }

  private extractTestResultsGrouped(unitCodeResults: AntechV6UnitCodeResult[]): TestResult[] {
    const filteredResults = unitCodeResults.filter(
      (unitCodeResult) =>
        !(
          unitCodeResult.ResultStatus?.toString() === 'F' &&
          (!unitCodeResult.TestCodeResults || unitCodeResult.TestCodeResults.length === 0)
        ),
    )

    const testResultGroups = new Map<
      string,
      {
        profileExtId?: string
        unitCodeExtId?: string
        orderCode?: string
        displayName: string
        items: AntechV6UnitCodeResult[]
        originalIndex: number
        leastAdvancedStatus: AntechV6ResultStatus
      }
    >()

    filteredResults.forEach((unitCodeResult, idx) => {
      const key = unitCodeResult.OrderCode || unitCodeResult.UnitCodeExtID
      const status = (unitCodeResult.ResultStatus?.toString() || 'I') as AntechV6ResultStatus

      if (!testResultGroups.has(key)) {
        testResultGroups.set(key, {
          profileExtId: unitCodeResult.ProfileExtID,
          unitCodeExtId: unitCodeResult.UnitCodeExtID,
          orderCode: unitCodeResult.OrderCode,
          displayName: unitCodeResult.ProfileDisplayName || unitCodeResult.UnitCodeDisplayName,
          items: [unitCodeResult],
          originalIndex: idx,
          leastAdvancedStatus: status,
        })
      } else {
        const group = testResultGroups.get(key)!
        group.items.push(unitCodeResult)

        group.leastAdvancedStatus = this.combineStatus(group.leastAdvancedStatus, status)
      }
    })

    const orderedGroups = Array.from(testResultGroups.values()).sort(
      (a, b) => a.originalIndex - b.originalIndex,
    )

    return orderedGroups.map((group) => this.mapGroupToTestResult(group))
  }

  private extractTestResultValueX(
    testCodeResult: AntechV6TestCodeResult,
  ): Pick<TestResultItem, 'valueString' | 'valueQuantity'> {
    if (isNumber(testCodeResult.Result)) {
      return {
        valueQuantity: {
          value: parseFloat(testCodeResult.Result),
          units: testCodeResult.Unit || '',
        },
      }
    } else {
      return {
        valueString: testCodeResult.Result || '',
      }
    }
  }

  private extractTestResultInterpretation(
    testCodeResult: AntechV6TestCodeResult,
  ): Pick<TestResultItem, 'interpretation'> {
    if (!isNullOrUndefinedOrEmpty(testCodeResult.AbnormalFlag)) {
      return {
        interpretation: {
          code: this.mapAntechV6AbnormalFlag(testCodeResult.AbnormalFlag),
          text: testCodeResult.AbnormalFlag || '',
        },
      }
    }

    return {}
  }

  private mapAntechV6AbnormalFlag(abnormalFlag?: string): TestResultItemInterpretationCode {
    // TODO(gb): map other abnormal flags
    switch (abnormalFlag) {
      case 'H':
        return TestResultItemInterpretationCode.HIGH
      case 'P':
        return TestResultItemInterpretationCode.POSITIVE
      case 'L':
        return TestResultItemInterpretationCode.LOW
      case '*':
        return TestResultItemInterpretationCode.ABNORMAL
      default:
        return TestResultItemInterpretationCode.NORMAL
    }
  }

  private extractTestResultReferenceRange(
    testCodeResult: AntechV6TestCodeResult,
  ): Pick<TestResultItem, 'referenceRange'> {
    if (testCodeResult.Range !== undefined) {
      return {
        referenceRange: [
          {
            type: ReferenceRangeType.NORMAL,
            text: testCodeResult.Range,
            ...this.extractReferenceRangeLimits(testCodeResult.Range),
          },
        ],
      }
    }

    return {}
  }

  private extractReferenceRangeLimits(range: string): Pick<ReferenceRange, 'low' | 'high'> {
    if (range.startsWith('<')) {
      return {
        high: parseFloat(range.slice(1)),
      }
    } else if (range.startsWith('>')) {
      return {
        low: parseFloat(range.slice(1)),
      }
    }

    const rangeParts = range.split('-')
    if (rangeParts.length === 2) {
      return {
        low: parseFloat(rangeParts[0]),
        high: parseFloat(rangeParts[1]),
      }
    }

    return {}
  }

  private extractTestResultNotes(
    testCodeResult: AntechV6TestCodeResult,
  ): Pick<TestResultItem, 'notes'> {
    if (!isNullOrUndefinedOrEmpty(testCodeResult.Comments)) {
      return {
        notes: testCodeResult.Comments || '',
      }
    }

    return {}
  }

  private mapOrderStatus(orderStatus: AntechV6OrderStatus): OrderStatus {
    switch (orderStatus) {
      case AntechV6OrderStatus.Draft:
        return OrderStatus.ACCEPTED
      case AntechV6OrderStatus.Submitted:
        return OrderStatus.SUBMITTED
      case AntechV6OrderStatus.Received:
      case AntechV6OrderStatus.Partial:
        return OrderStatus.PARTIAL
      case AntechV6OrderStatus.Resulted:
      case AntechV6OrderStatus.Final:
        return OrderStatus.COMPLETED
      case AntechV6OrderStatus.Expired:
      case AntechV6OrderStatus.Canceled:
        return OrderStatus.CANCELLED
      default:
        return OrderStatus.SUBMITTED
    }
  }

  private extractClientName(client: PersonDetails): Pick<Client, 'firstName' | 'lastName'> {
    return {
      firstName: client.FirstName || '',
      lastName: client.LastName || '',
    }
  }

  private extractVeterinarianName(
    doctor: PersonDetails,
  ): Pick<VeterinarianPayload, 'firstName' | 'lastName'> {
    return {
      firstName: doctor.FirstName || '',
      lastName: doctor.LastName || '',
    }
  }

  private extractOrderFromResult(result: AntechV6Result): Order {
    return {
      externalId: result.LabAccessionID,
      status: this.mapOrderStatus(result.OrderStatus),
      patient: extractPatientFromResult(result),
      client: extractClientFromResult(result),
      veterinarian: extractVeterinarianFromResult(result),
      tests: extractOrderTestCodesFromResult(result),
    }
  }

  private mapGroupToTestResult(group: {
    profileExtId?: string
    unitCodeExtId?: string
    orderCode?: string
    displayName: string
    items: AntechV6UnitCodeResult[]
    originalIndex: number
    leastAdvancedStatus: AntechV6ResultStatus
  }): TestResult {
    const flattenedTestCodeResults = group.items.flatMap((u) => u.TestCodeResults || [])
    const code = group.orderCode || group.profileExtId || group.unitCodeExtId || ''
    const testResultItems = flattenedTestCodeResults.map((testCodeResult, idx) =>
      this.mapAntechV6TestCodeResult(testCodeResult, idx, group.orderCode),
    )

    return {
      seq: group.originalIndex,
      code,
      name: group.displayName,
      items: testResultItems.sort((a, b) =>
        a.seq !== undefined && b.seq !== undefined ? a.seq - b.seq : -1,
      ),
    }
  }

  private combineStatus(
    firsTestStatus: AntechV6ResultStatus,
    secondTestStatus: AntechV6ResultStatus,
  ): AntechV6ResultStatus {
    if (
      firsTestStatus === AntechV6ResultStatus.IN_PROGRESS &&
      secondTestStatus === AntechV6ResultStatus.IN_PROGRESS
    ) {
      return AntechV6ResultStatus.IN_PROGRESS
    }
    if (
      firsTestStatus === AntechV6ResultStatus.IN_PROGRESS ||
      secondTestStatus === AntechV6ResultStatus.IN_PROGRESS
    ) {
      return AntechV6ResultStatus.PARTIAL
    }
    if (
      firsTestStatus === AntechV6ResultStatus.PARTIAL ||
      secondTestStatus === AntechV6ResultStatus.PARTIAL
    ) {
      return AntechV6ResultStatus.PARTIAL
    }
    if (
      firsTestStatus === AntechV6ResultStatus.FINAL &&
      secondTestStatus === AntechV6ResultStatus.FINAL
    ) {
      return AntechV6ResultStatus.FINAL
    }
    return AntechV6ResultStatus.UPDATED_CORRECTED
  }
}
