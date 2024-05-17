import { IMetadata } from '@nominal-systems/dmi-engine-common'
export interface AntechV6MessageData<Payload = any> extends IMetadata {
  providerConfiguration: AntechV6ProviderConfiguration
  integrationOptions: AntechV6IntegrationOptions
  payload?: Payload
}

export interface AntechV6ProviderConfiguration {
  baseUrl: string
  uiBaseUrl: string,
  PimsIdentifier: string
}

export interface AntechV6IntegrationOptions {
  username: string
  password: string
  clinicId: string
  labId: string
}
