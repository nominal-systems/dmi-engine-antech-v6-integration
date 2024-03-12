export enum AntechV6Endpoints {
  LOGIN = '/Users/v6/Login',
  GET_STATUS = '/LabResults/v6/GetStatus'
}

export interface AntechV6OrderStatus {
  LabOrders?: any
}

export interface AntechV6UserCredentials {
  UserName: string
  Password: string
  ClinicID: string
}

export interface AntechV6AccessToken {
  Token: string
}
