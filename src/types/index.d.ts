export type Trip = {
  radar_id: string,
  external_id: string,
  user_id: string,
  geofence_id: string,
  geofence_tag: string,
  mode: string,
  status: string,
  duration: number,
  live: boolean,
  approaching_threshold: number,
  locations?: number[]
};