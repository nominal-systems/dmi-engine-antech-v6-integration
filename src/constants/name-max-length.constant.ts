/**
 * The longest name Antech V6 accepts in each field. A longer one fails the whole placement with a
 * 400 that names the field as missing (`"ClientFirstName is mandatory"`), not as too long.
 * Measured against PreOrderPlacement: each value here passes and one character more is refused.
 */
export const NAME_MAX_LENGTH = {
  ClientFirstName: 20,
  ClientLastName: 20,
  DoctorFirstName: 30,
  DoctorLastName: 30,
  PetName: 32,
} as const
