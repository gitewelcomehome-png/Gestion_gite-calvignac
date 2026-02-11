export type Reservation = {
  id: string;
  gite_id: string | null;
  gite: string | null;
  check_in: string | null;
  check_out: string | null;
  client_name: string | null;
  status: string | null;
};

export type CleaningSchedule = {
  id: string;
  gite_id: string | null;
  gite: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
};

export type Gite = {
  id: string;
  name: string | null;
  is_active: boolean | null;
};
