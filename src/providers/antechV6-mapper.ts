import { Injectable } from '@nestjs/common'
import {
  ClientPayload,
  CreateOrderPayload,
  Identifier,
  OrderCreatedResponse,
  OrderPatient,
  OrderStatus,
  PimsIdentifiers,
  VeterinarianPayload
} from '@nominal-systems/dmi-engine-common'
import {
  AntechV6AccessToken,
  AntechV6Client,
  AntechV6Doctor,
  AntechV6Pet,
  AntechV6PetSex,
  AntechV6PreOrder,
  AntechV6PreOrderPlacement
} from '../interfaces/antechV6-api.interface'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'

@Injectable()
export class AntechV6Mapper {
  mapCreateOrderPayload(payload: CreateOrderPayload, metadata: AntechV6MessageData): AntechV6PreOrder {
    return {
      ...this.extractLabId(metadata),
      ...this.extractClinicId(metadata),
      ...this.extractClinicAccessionId(payload),
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
      externalId: preOrderPlacement.Value,
      status: OrderStatus.WAITING_FOR_INPUT,
      submissionUri: `${metadata.providerConfiguration.uiBaseUrl}/testGuide?ClinicAccessionID=${preOrder.ClinicAccessionID}&accessToken=${preOrderPlacement.Token}`
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

  private extractClinicAccessionId(payload: CreateOrderPayload): Pick<AntechV6PreOrder, 'ClinicAccessionID'> {
    return {
      ClinicAccessionID: payload.requisitionId
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
      // TODO(gb): extract pet age
      PetSex: AntechV6PetSex.UNKNOWN,
      PetAge: 1,
      PetAgeUnits: 'Y',
      // TODO(gb): extract pet weight
      // TODO(gb): extract pet species/breed
      SpeciesID: 41,
      BreedID: 370
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
}
