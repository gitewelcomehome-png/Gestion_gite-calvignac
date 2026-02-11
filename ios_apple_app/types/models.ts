export type Reservation = {
  id: string;
  gite_id: string | null;
  gite: string | null;
  check_in: string | null;
  check_out: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  status: string | null;
  platform: string | null;
  total_price: number | null;
  guest_count: number | null;
  owner_user_id: string | null;
};

export type CleaningSchedule = {
  id: string;
  gite_id: string | null;
  gite: string | null;
  scheduled_date: string | null;
  status: string | null;
  gites?: {
    name: string | null;
  } | null;
};

export type Gite = {
  id: string;
  name: string | null;
  is_active: boolean | null;
  // Support des deux formats (transition array→object)
  tarifs_calendrier?: Record<string, number | { prix: number; promo?: boolean; prixOriginal?: number }> | Array<{date: string; prix_nuit: number}> | null;
  regles_tarifs?: ReglesTarifaires | null;
  color?: string | null;
  icon?: string | null;
};

export type ReglesTarifaires = {
  prix_base?: number;
  duree_min_defaut?: number;
  promotions?: {
    last_minute?: {
      actif: boolean;
      pourcentage: number;
      jours_avant: number;
    };
    early_booking?: {
      actif: boolean;
      pourcentage: number;
      jours_avant: number;
    };
    longue_duree?: {
      actif: boolean;
      pourcentage: number;
      nb_nuits_min: number;
    };
  };
  promocodes?: Array<{
    code: string;
    type: 'percentage' | 'fixed';
    valeur: number;
    actif: boolean;
    date_debut?: string;
    date_fin?: string;
  }>;
};

export type ShoppingList = {
  id: string;
  owner_user_id: string;
  name: string;
  created_date: string;
  status: 'en_cours' | 'validé';
  validated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShoppingListItem = {
  id: string;
  list_id: string;
  item_name: string;
  is_checked: boolean;
  added_by: string | null;
  gite_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type KmLieuFavori = {
  id: string;
  owner_user_id: string;
  nom: string;
  adresse: string | null;
  distance_km: number;
  created_at: string;
  updated_at: string;
};

export type KmTrajet = {
  id?: string;
  owner_user_id: string;
  annee: number;
  date_trajet: string;
  type_trajet: string;
  motif: string;
  lieu_depart: string | null;
  lieu_arrivee: string;
  gite_id: string | null;
  distance_aller: number;
  aller_retour: boolean;
  distance_totale: number;
  reservation_id: string | null;
  auto_genere: boolean;
  notes: string | null;
};
