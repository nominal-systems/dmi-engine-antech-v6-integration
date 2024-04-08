import { Injectable } from '@nestjs/common'
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
  VeterinarianPayload
} from '@nominal-systems/dmi-engine-common'
import {
  AntechV6AccessToken,
  AntechV6Client,
  AntechV6Doctor,
  AntechV6LabOrderStatus,
  AntechV6LabResultStatus,
  AntechV6Pet,
  AntechV6PetSex,
  AntechV6PreOrder,
  AntechV6PreOrderPlacement,
  AntechV6Result,
  AntechV6Test,
  AntechV6TestCodeResult,
  AntechV6TestGuide,
  AntechV6UnitCodeResult
} from '../interfaces/antechV6-api.interface'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { TestResult } from '@nominal-systems/dmi-engine-common/lib/interfaces/provider-service'
import {
  extractPetAge,
  generateClinicAccessionId,
  mapPatientSex,
  mapTestCodeResultStatus
} from '../common/utils/mapper-utils'
import { DEFAULT_PET_SPECIES } from '../constants/default-pet-species'
import { DEFAULT_PET_BREED } from '../constants/default-pet-breed'
import { PIMS_ID } from '../constants/pims-id'

@Injectable()
export class AntechV6Mapper {
  mapCreateOrderPayload(payload: CreateOrderPayload, metadata: AntechV6MessageData): AntechV6PreOrder {
    return {
      ...this.extractLabId(metadata),
      ...this.extractClinicId(metadata),
      ...this.extractClinicAccessionId(payload, metadata.integrationOptions.clinicId),
      ...this.extractClient(payload.client),
      ...this.extractDoctor(payload.veterinarian),
      ...this.extractPet(payload.patient),
      ...this.extractOrderCodes(payload)
    }
  }

  mapAntechV6PreOrder(
    preOrder: AntechV6PreOrder,
    preOrderPlacement: AntechV6PreOrderPlacement & AntechV6AccessToken,
    metadata: AntechV6MessageData
  ): OrderCreatedResponse {
    return {
      requisitionId: preOrder.ClinicAccessionID,
      externalId: preOrder.ClinicAccessionID,
      status: OrderStatus.WAITING_FOR_INPUT,
      submissionUri: `${metadata.providerConfiguration.uiBaseUrl}/testGuide?ClinicAccessionID=${preOrder.ClinicAccessionID}&accessToken=${preOrderPlacement.Token}`
    }
  }

  mapAntechV6OrderStatus(
    orderStatus: AntechV6LabOrderStatus
  ): Pick<Order, 'externalId' | 'status' | 'tests' | 'editable'> {
    return {
      externalId: orderStatus.ClinicAccessionID,
      status: this.mapOrderStatus(orderStatus.OrderStatus),
      tests: orderStatus.LabTests.map((test) => {
        return {
          code: test.Mnemonic
        }
      }),
      editable: false
    }
  }

  mapAntechV6ResultStatus(resultStatus: AntechV6LabResultStatus): Pick<Order, 'patient' | 'client' | 'veterinarian'> {
    const extractIdentifier = (
      obj: AntechV6LabResultStatus,
      key: string,
      system: string
    ): { identifier?: Identifier[] } => {
      return obj[key] ? { identifier: [{ system, value: obj[key] }] } : {}
    }
    return {
      patient: {
        name: resultStatus.PetName,
        sex: AntechV6PetSex.UNKNOWN,
        species: String(resultStatus.SpeciesID),
        breed: String(resultStatus.BreedID),
        ...extractIdentifier(resultStatus, 'PetID', PimsIdentifiers.PatientID)
      },
      client: {
        ...this.parseClientName(resultStatus.ClientName),
        ...extractIdentifier(resultStatus, 'ClientID', PimsIdentifiers.ClientID)
      },
      veterinarian: {
        ...this.parseDoctorName(resultStatus.DoctorName)
      }
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
        currency: 'USD'
        // TODO(gb): map labRequisitionInfo
      }
    })
  }

  mapAntechV6Result(result: AntechV6Result): Result {
    return {
      id: String(result.ID),
      orderId: result.ClinicAccessionID,
      accession: result.LabAccessionID,
      status: this.extractResultStatus(result),
      testResults: this.extractTestResults(result.UnitCodeResults)
    }
  }

  mapAntechV6UnitCodeResult(unitCodeResult: AntechV6UnitCodeResult, index: number): TestResult {
    return {
      seq: index,
      code: unitCodeResult.UnitCodeExtID,
      name: unitCodeResult.UnitCodeDisplayName,
      items: unitCodeResult.TestCodeResults?.map(this.mapAntechV6TestCodeResult, this)
    }
  }

  mapAntechV6TestCodeResult(testCodeResult: AntechV6TestCodeResult, index: number): TestResultItem {
    return {
      seq: index,
      code: testCodeResult.TestCodeExtID,
      name: testCodeResult.Test,
      status: mapTestCodeResultStatus(testCodeResult.ResultStatus),
      ...this.extractTestResultValueX(testCodeResult),
      ...this.extractTestResultInterpretation(testCodeResult),
      ...this.extractTestResultReferenceRange(testCodeResult),
      ...this.extractTestResultNotes(testCodeResult)
    }
  }

  private extractLabId(metadata: AntechV6MessageData): Pick<AntechV6PreOrder, 'LabID'> {
    return {
      LabID: parseInt(metadata.integrationOptions.labId)
    }
  }

  private extractClinicId(metadata: AntechV6MessageData): Pick<AntechV6PreOrder, 'ClinicID'> {
    return {
      ClinicID: metadata.integrationOptions.clinicId
    }
  }

  private extractClinicAccessionId(
    payload: CreateOrderPayload,
    clinicId: string
  ): Pick<AntechV6PreOrder, 'ClinicAccessionID'> {
    return {
      ClinicAccessionID: !isNullOrUndefinedOrEmpty(payload.requisitionId)
        ? payload.requisitionId
        : generateClinicAccessionId(clinicId, PIMS_ID)
    }
  }

  private extractClient(client: ClientPayload): AntechV6Client {
    return {
      ClientID: this.getIdFromIdentifier(PimsIdentifiers.ClientID, client.identifier) || client.id,
      ClientFirstName: client.firstName ? client.firstName : '',
      ClientLastName: client.lastName
      // TODO(gb): extract client address
      // TODO(gb): extract client contact
    }
  }

  private extractDoctor(veterinarian: VeterinarianPayload): AntechV6Doctor {
    return {
      DoctorID: this.getIdFromIdentifier(PimsIdentifiers.VeterinarianID, veterinarian.identifier) || veterinarian.id,
      DoctorFirstName: veterinarian.firstName ? veterinarian.firstName : '',
      DoctorLastName: veterinarian.lastName
      // TODO(gb): extract doctor contact
    }
  }

  private extractPet(patient: OrderPatient): AntechV6Pet {
    return {
      PetID: this.getIdFromIdentifier(PimsIdentifiers.PatientID, patient.identifier) || patient.id,
      PetName: patient.name,
      PetSex: mapPatientSex(patient.sex),
      ...extractPetAge(patient.birthdate),
      ...this.extractPetWeight(patient),
      SpeciesID: isNumber(patient.species) ? parseInt(patient.species) : DEFAULT_PET_SPECIES,
      BreedID: patient.breed !== undefined && isNumber(patient.breed) ? parseInt(patient.breed) : DEFAULT_PET_BREED
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

  private extractResultStatus(result: AntechV6Result): ResultStatus {
    const status = ResultStatus.PENDING

    if (result.Corrected !== undefined && result.Corrected !== '') {
      return ResultStatus.REVISED
    }

    if (result.PendingTestCount === 0) {
      return ResultStatus.COMPLETED
    }

    return status
  }

  private extractTestResults(unitCodeResults: AntechV6UnitCodeResult[]): TestResult[] {
    return unitCodeResults.map(this.mapAntechV6UnitCodeResult, this)
  }

  private extractTestResultValueX(
    testCodeResult: AntechV6TestCodeResult
  ): Pick<TestResultItem, 'valueString' | 'valueQuantity'> {
    if (isNumber(testCodeResult.Result)) {
      return {
        valueQuantity: {
          value: parseFloat(testCodeResult.Result),
          units: testCodeResult.Unit || ''
        }
      }
    } else {
      return {
        valueString: testCodeResult.Result || ''
      }
    }

    return {}
  }

  private extractTestResultInterpretation(
    testCodeResult: AntechV6TestCodeResult
  ): Pick<TestResultItem, 'interpretation'> {
    if (!isNullOrUndefinedOrEmpty(testCodeResult.AbnormalFlag)) {
      return {
        interpretation: {
          code: this.mapAntechV6AbnormalFlag(testCodeResult.AbnormalFlag),
          text: testCodeResult.AbnormalFlag || ''
        }
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
      default:
        return TestResultItemInterpretationCode.NORMAL
    }
  }

  private extractTestResultReferenceRange(
    testCodeResult: AntechV6TestCodeResult
  ): Pick<TestResultItem, 'referenceRange'> {
    if (testCodeResult.Range !== undefined) {
      return {
        referenceRange: [
          {
            type: ReferenceRangeType.NORMAL,
            text: testCodeResult.Range,
            ...this.extractReferenceRangeLimits(testCodeResult.Range)
          }
        ]
      }
    }

    return {}
  }

  private extractReferenceRangeLimits(range: string): Pick<ReferenceRange, 'low' | 'high'> {
    if (range.startsWith('<')) {
      return {
        high: parseFloat(range.slice(1))
      }
    } else if (range.startsWith('>')) {
      return {
        low: parseFloat(range.slice(1))
      }
    }

    const rangeParts = range.split('-')
    if (rangeParts.length === 2) {
      return {
        low: parseFloat(rangeParts[0]),
        high: parseFloat(rangeParts[1])
      }
    }

    return {}
  }

  private extractTestResultNotes(testCodeResult: AntechV6TestCodeResult): Pick<TestResultItem, 'notes'> {
    if (!isNullOrUndefinedOrEmpty(testCodeResult.Comments)) {
      return {
        notes: testCodeResult.Comments || ''
      }
    }

    return {}
  }

  private mapOrderStatus(orderStatus: number): OrderStatus {
    switch (orderStatus) {
      case 1:
        return OrderStatus.SUBMITTED
      case 2:
        return OrderStatus.PARTIAL
      default:
        return OrderStatus.SUBMITTED
    }
  }

  private parseClientName(clientName: string): Pick<Client, 'firstName' | 'lastName'> {
    const parts = clientName.split(' ')
    return {
      firstName: parts[1],
      lastName: parts[0]
    }
  }

  private parseDoctorName(doctorName: string): Pick<VeterinarianPayload, 'firstName' | 'lastName'> {
    const parts = doctorName.split(', ')
    return {
      firstName: parts[1],
      lastName: parts[0]
    }
  }

  private extractPetWeight(patient: OrderPatient): Pick<AntechV6Pet, 'PetWeight' | 'PetWeightUnits'> {
    if (!isNullOrUndefinedOrEmpty(patient.weightMeasurement) && !isNullOrUndefinedOrEmpty(patient.weightUnits)) {
      return {
        PetWeight: patient.weightMeasurement,
        PetWeightUnits: patient.weightUnits
      }
    } else {
      return {}
    }
  }
}
