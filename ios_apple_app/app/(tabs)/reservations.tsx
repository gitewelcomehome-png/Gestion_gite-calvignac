import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';

type Gite = {
  id: string;
  name: string;
  color: string;
};

type Reservation = {
  id: string;
  gite_id: string;
  client_name: string;
  check_in: string;
  check_out: string;
  check_in_time: string | null;
  check_out_time: string | null;
  gite?: Gite;
};

type ChecklistTemplate = {
  id: string;
  type: 'entree' | 'sortie';
  texte: string;
  description: string | null;
  ordre: number;
};

type ChecklistProgress = {
  id: string;
  template_id: string;
  completed: boolean;
};

type ProblemeSignale = {
  id: string;
  owner_user_id: string;
  reservation_id: string | null;
  gite_id: string | null;
  type: 'demande' | 'retour' | 'amelioration' | 'probleme';
  sujet: string;
  description: string;
  urgence: 'basse' | 'normale' | 'haute' | null;
  statut: 'en_attente' | 'en_cours' | 'resolu' | 'clos';
  reponse: string | null;
  created_at: string;
  gite?: Gite;
};

type DemandeHoraire = {
  id: string;
  owner_user_id: string;
  reservation_id: string;
  type: 'arrivee' | 'depart';
  heure_demandee: string;
  motif: string | null;
  statut: 'en_attente' | 'validee' | 'refusee';
  created_at: string;
  reservation?: Reservation;
};

type ReservationWithProgress = Reservation & {
  checklistEntree: ChecklistTemplate[];
  checklistSortie: ChecklistTemplate[];
  progressEntree: Record<string, boolean>;
  progressSortie: Record<string, boolean>;
};

export default function ReservationsScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithProgress[]>([]);
  const [currentReservationIndex, setCurrentReservationIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [problemesSignales, setProblemesSignales] = useState<ProblemeSignale[]>([]);
  const [demandesHoraires, setDemandesHoraires] = useState<DemandeHoraire[]>([]);
  const [showReponseFor, setShowReponseFor] = useState<string | null>(null);
  const [reponseText, setReponseText] = useState('');

  // Charger les réservations en cours
  const loadReservations = useCallback(async () => {
    if (!supabase || !user) return;

    const today = new Date().toISOString().split('T')[0];

    // Réservations en cours (check_in <= aujourd'hui ET check_out >= aujourd'hui)
    const { data: reservationsData, error: resaError } = await supabase
      .from('reservations')
      .select('id, gite_id, client_name, check_in, check_out, check_in_time, check_out_time')
      .eq('owner_user_id', user.id)
      .lte('check_in', today)
      .gte('check_out', today)
      .order('check_in', { ascending: true });

    if (resaError) {
      console.error('Erreur chargement réservations:', resaError);
      return;
    }

    if (!reservationsData || reservationsData.length === 0) {
      setReservations([]);
      return;
    }

    // Charger les gîtes
    const giteIds = [...new Set(reservationsData.map((r) => r.gite_id))];
    const { data: gitesData } = await supabase
      .from('gites')
      .select('id, name, color')
      .in('id', giteIds);

    const gitesMap = (gitesData || []).reduce((acc, gite) => {
      acc[gite.id] = gite;
      return acc;
    }, {} as Record<string, Gite>);

    // Charger les templates de checklist
    const { data: templatesData } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('ordre', { ascending: true });

    // Charger la progression pour toutes les réservations
    const reservationIds = reservationsData.map((r) => r.id);
    const { data: progressData } = await supabase
      .from('checklist_progress')
      .select('*')
      .in('reservation_id', reservationIds);

    // Charger les problèmes signalés / retours clients (TOUS les statuts comme le dashboard web)
    const { data: problemesData, error: problemesError } = await supabase
      .from('problemes_signales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (problemesError) {
      console.error('Erreur chargement problèmes:', problemesError);
    }

    // Enrichir avec les gîtes
    if (problemesData && problemesData.length > 0) {
      const giteIdsProblemes = [...new Set(problemesData.map(p => p.gite_id).filter(Boolean))];
      
      if (giteIdsProblemes.length > 0) {
        const { data: gitesProblemes } = await supabase
          .from('gites')
          .select('id, name, color')
          .in('id', giteIdsProblemes);

        if (gitesProblemes) {
          const gitesMapProblemes: Record<string, Gite> = {};
          gitesProblemes.forEach(g => {
            gitesMapProblemes[g.id] = g;
          });

          problemesData.forEach(p => {
            if (p.gite_id && gitesMapProblemes[p.gite_id]) {
              p.gite = gitesMapProblemes[p.gite_id];
            }
          });
        }
      }
    }

    setProblemesSignales(problemesData || []);

    // Charger les demandes horaires en attente
    const { data: demandesData, error: demandesError } = await supabase
      .from('demandes_horaires')
      .select('*')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false });

    if (demandesError) {
      console.error('Erreur chargement demandes:', demandesError);
    }

    // Enrichir avec les réservations
    if (demandesData && demandesData.length > 0) {
      const reservationIdsDemandes = [...new Set(demandesData.map(d => d.reservation_id).filter(Boolean))];
      
      if (reservationIdsDemandes.length > 0) {
        const { data: reservationsDemandes } = await supabase
          .from('reservations')
          .select('id, client_name, gite, gite_id, check_in, check_out')
          .in('id', reservationIdsDemandes);

        if (reservationsDemandes) {
          // Charger les gîtes pour avoir les couleurs
          const giteIdsDemandes = [...new Set(reservationsDemandes.map(r => r.gite_id).filter(Boolean))];
          let gitesMapDemandes: Record<string, Gite> = {};

          if (giteIdsDemandes.length > 0) {
            const { data: gitesDemandes } = await supabase
              .from('gites')
              .select('id, name, color')
              .in('id', giteIdsDemandes);

            if (gitesDemandes) {
              gitesDemandes.forEach(g => {
                gitesMapDemandes[g.id] = g;
              });
            }
          }

          // Mapper réservations avec gîtes
          const reservationsMapDemandes: Record<string, any> = {};
          reservationsDemandes.forEach(r => {
            reservationsMapDemandes[r.id] = {
              ...r,
              gite: r.gite_id && gitesMapDemandes[r.gite_id] ? gitesMapDemandes[r.gite_id] : undefined
            };
          });

          // Enrichir demandes avec réservations
          demandesData.forEach(d => {
            if (d.reservation_id && reservationsMapDemandes[d.reservation_id]) {
              d.reservation = reservationsMapDemandes[d.reservation_id];
            }
          });

        }
      }
    }

    setDemandesHoraires(demandesData || []);

    // Organiser les données
    const reservationsWithProgress: ReservationWithProgress[] = reservationsData.map((resa) => {
      const gite = gitesMap[resa.gite_id];
      
      // Templates pour ce gîte
      const templatesEntree = (templatesData || []).filter(
        (t: ChecklistTemplate) => t.type === 'entree'
      );
      const templatesSortie = (templatesData || []).filter(
        (t: ChecklistTemplate) => t.type === 'sortie'
      );

      // Progression
      const resaProgress = (progressData || []).filter((p: any) => p.reservation_id === resa.id);
      const progressEntree: Record<string, boolean> = {};
      const progressSortie: Record<string, boolean> = {};

      resaProgress.forEach((p: any) => {
        const template = (templatesData || []).find((t: any) => t.id === p.template_id);
        if (template) {
          if (template.type === 'entree') {
            progressEntree[p.template_id] = p.completed;
          } else {
            progressSortie[p.template_id] = p.completed;
          }
        }
      });

      return {
        ...resa,
        gite,
        checklistEntree: templatesEntree,
        checklistSortie: templatesSortie,
        progressEntree,
        progressSortie,
      };
    });

    setReservations(reservationsWithProgress);
  }, [supabase, user]);

  // Toggle completion d'un item
  const toggleChecklistItem = async (templateId: string, currentStatus: boolean) => {
    if (!supabase || !user) return;

    const currentResa = reservations[currentReservationIndex];
    if (!currentResa) return;

    try {
      if (currentStatus) {
        // Marquer comme incomplet (supprimer la progression)
        await supabase
          .from('checklist_progress')
          .delete()
          .eq('reservation_id', currentResa.id)
          .eq('template_id', templateId);
      } else {
        // Marquer comme complet
        await supabase.from('checklist_progress').upsert({
          owner_user_id: user.id,
          reservation_id: currentResa.id,
          template_id: templateId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      // Recharger
      await loadReservations();
    } catch (error: any) {
      console.error('Erreur toggle checklist:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    }
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  }, [loadReservations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Marquer un problème comme traité
  const marquerCommeTraite = async (problemeId: string) => {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from('problemes_signales')
        .update({ statut: 'resolu' })
        .eq('id', problemeId);

      if (error) throw error;

      Alert.alert('✓ Marqué comme traité', 'Le problème a été marqué comme résolu');
      await loadReservations();
    } catch (error: any) {
      console.error('Erreur marquer traité:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme traité');
    }
  };

  // Supprimer une demande/problème
  const supprimerDemande = async (problemeId: string) => {
    if (!supabase || !user) return;

    const supabaseClient = supabase; // Capture pour le callback

    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette demande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabaseClient
                .from('problemes_signales')
                .delete()
                .eq('id', problemeId);

              if (error) throw error;

              Alert.alert('✓ Supprimé', 'La demande a été supprimée');
              await loadReservations();
            } catch (error: any) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  // Enregistrer une réponse
  const envoyerReponse = async (problemeId: string) => {
    if (!supabase || !user || !reponseText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une réponse');
      return;
    }

    try {
      const { error } = await supabase
        .from('problemes_signales')
        .update({
          reponse: reponseText,
          statut: 'en_cours',
        })
        .eq('id', problemeId);

      if (error) throw error;

      Alert.alert('✓ Réponse enregistrée', 'Votre réponse a été enregistrée');
      setShowReponseFor(null);
      setReponseText('');
      await loadReservations();
    } catch (error: any) {
      console.error('Erreur envoi réponse:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la réponse');
    }
  };

  // Valider une demande horaire
  const validerDemandeHoraire = async (demandeId: string, heureValidee: string) => {
    if (!supabase || !user) return;

    try {
      // 1. Récupérer la demande pour connaître le type et la réservation
      const { data: demande, error: fetchError } = await supabase
        .from('demandes_horaires')
        .select('*')
        .eq('id', demandeId)
        .single();

      if (fetchError) throw fetchError;
      if (!demande || !demande.reservation_id) {
        Alert.alert('❌ Erreur', 'Demande ou réservation introuvable');
        return;
      }

      // 2. Mettre à jour l'heure dans la réservation
      const champHeure = demande.type === 'arrivee' ? 'check_in_time' : 'check_out_time';
      const { error: updateResaError } = await supabase
        .from('reservations')
        .update({
          [champHeure]: heureValidee,
          updated_at: new Date().toISOString(),
        })
        .eq('id', demande.reservation_id);

      if (updateResaError) throw updateResaError;

      // 3. Mettre à jour le statut de la demande
      const { error } = await supabase
        .from('demandes_horaires')
        .update({
          statut: 'validee',
          updated_at: new Date().toISOString(),
        })
        .eq('id', demandeId);

      if (error) throw error;

      Alert.alert('✓ Validé', 'Demande validée avec succès !');
      await loadReservations();
    } catch (error: any) {
      console.error('Erreur validation:', error);
      Alert.alert('Erreur', 'Impossible de valider la demande');
    }
  };

  // Refuser une demande horaire
  const refuserDemandeHoraire = async (demandeId: string) => {
    if (!supabase || !user) return;

    Alert.alert(
      'Refuser la demande',
      'Êtes-vous sûr de vouloir refuser cette demande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('demandes_horaires')
                .update({
                  statut: 'refusee',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', demandeId);

              if (error) throw error;

              Alert.alert('❌ Refusé', 'Demande refusée');
              await loadReservations();
            } catch (error: any) {
              console.error('Erreur refus:', error);
              Alert.alert('Erreur', 'Impossible de refuser la demande');
            }
          },
        },
      ]
    );
  };

  const currentResa = reservations[currentReservationIndex];

  if (!currentResa) {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
        <View style={styles.header}>
          <ThemedText type="title">📅 Réservations</ThemedText>
        </View>
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>Aucune réservation en cours</ThemedText>
        </View>
      </ScrollView>
    );
  }

  // Calcul progression
  const totalEntree = currentResa.checklistEntree.length;
  const completedEntree = currentResa.checklistEntree.filter(
    (t) => currentResa.progressEntree[t.id]
  ).length;
  const percentEntree = totalEntree > 0 ? Math.round((completedEntree / totalEntree) * 100) : 0;

  const totalSortie = currentResa.checklistSortie.length;
  const completedSortie = currentResa.checklistSortie.filter(
    (t) => currentResa.progressSortie[t.id]
  ).length;
  const percentSortie = totalSortie > 0 ? Math.round((completedSortie / totalSortie) * 100) : 0;

  const colorEntree = percentEntree === 100 ? '#27AE60' : percentEntree > 0 ? '#f39c12' : '#E74C3C';
  const colorSortie = percentSortie === 100 ? '#27AE60' : percentSortie > 0 ? '#f39c12' : '#E74C3C';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
      
      <View style={styles.header}>
        <ThemedText type="title">📅 Réservations</ThemedText>
      </View>

      {/* Navigation */}
      <View style={styles.paginationNav}>
        <TouchableOpacity
          style={[styles.paginationButton, currentReservationIndex === 0 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentReservationIndex(Math.max(0, currentReservationIndex - 1))}
          disabled={currentReservationIndex === 0}>
          <ThemedText style={[styles.paginationButtonText, currentReservationIndex === 0 && styles.paginationButtonTextDisabled]}>
            ‹ Précédent
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.paginationInfo}>
          Réservation {currentReservationIndex + 1} sur {reservations.length}
        </ThemedText>

        <TouchableOpacity
          style={[styles.paginationButton, currentReservationIndex >= reservations.length - 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentReservationIndex(Math.min(reservations.length - 1, currentReservationIndex + 1))}
          disabled={currentReservationIndex >= reservations.length - 1}>
          <ThemedText style={[styles.paginationButtonText, currentReservationIndex >= reservations.length - 1 && styles.paginationButtonTextDisabled]}>
            Suivant ›
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Carte réservation */}
      <View style={[styles.resaCard, { borderColor: currentResa.gite?.color || '#667eea' }]}>
        {/* Header */}
        <View style={styles.resaHeader}>
          <View style={styles.resaInfo}>
            <ThemedText style={styles.resaClient}>{currentResa.client_name}</ThemedText>
            <ThemedText style={styles.resaMeta}>
              🏠 {currentResa.gite?.name || 'Gîte inconnu'}
            </ThemedText>
            <ThemedText style={styles.resaMeta}>
              📅 {new Date(currentResa.check_in).toLocaleDateString('fr-FR')} → {new Date(currentResa.check_out).toLocaleDateString('fr-FR')}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowDetails(!showDetails)}>
            <ThemedText style={styles.detailsButtonText}>
              {showDetails ? '🙈' : '👁️'} Détails
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Résumé progression */}
        <View style={styles.progressRow}>
          {/* Entrée */}
          <View style={[styles.progressCard, { borderColor: colorEntree }]}>
            <View style={styles.progressCardHeader}>
              <ThemedText style={styles.progressTitle}>🏠 Entrée</ThemedText>
              <ThemedText style={[styles.progressCount, { color: colorEntree }]}>
                {completedEntree}/{totalEntree}
              </ThemedText>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percentEntree}%`, backgroundColor: colorEntree }]} />
            </View>
            <ThemedText style={[styles.progressPercent, { color: colorEntree }]}>
              {percentEntree}%
            </ThemedText>
          </View>

          {/* Sortie */}
          <View style={[styles.progressCard, { borderColor: colorSortie }]}>
            <View style={styles.progressCardHeader}>
              <ThemedText style={styles.progressTitle}>🧳 Sortie</ThemedText>
              <ThemedText style={[styles.progressCount, { color: colorSortie }]}>
                {completedSortie}/{totalSortie}
              </ThemedText>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percentSortie}%`, backgroundColor: colorSortie }]} />
            </View>
            <ThemedText style={[styles.progressPercent, { color: colorSortie }]}>
              {percentSortie}%
            </ThemedText>
          </View>
        </View>

        {/* Détails checklists */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            <View style={styles.checklistsRow}>
              {/* Checklist Entrée */}
              <View style={styles.checklistColumn}>
                <ThemedText style={styles.checklistTitle}>🏠 Checklist Entrée</ThemedText>
                {currentResa.checklistEntree.map((item) => {
                  const isCompleted = currentResa.progressEntree[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.checklistItem}
                      onPress={() => toggleChecklistItem(item.id, isCompleted)}>
                      <ThemedText style={styles.checklistIcon}>
                        {isCompleted ? '✅' : '❌'}
                      </ThemedText>
                      <View style={styles.checklistItemText}>
                        <ThemedText style={[styles.checklistLabel, isCompleted && styles.checklistLabelCompleted]}>
                          {item.texte}
                        </ThemedText>
                        {item.description && (
                          <ThemedText style={styles.checklistDescription}>
                            {item.description}
                          </ThemedText>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Checklist Sortie */}
              <View style={styles.checklistColumn}>
                <ThemedText style={styles.checklistTitle}>🧳 Checklist Sortie</ThemedText>
                {currentResa.checklistSortie.map((item) => {
                  const isCompleted = currentResa.progressSortie[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.checklistItem}
                      onPress={() => toggleChecklistItem(item.id, isCompleted)}>
                      <ThemedText style={styles.checklistIcon}>
                        {isCompleted ? '✅' : '❌'}
                      </ThemedText>
                      <View style={styles.checklistItemText}>
                        <ThemedText style={[styles.checklistLabel, isCompleted && styles.checklistLabelCompleted]}>
                          {item.texte}
                        </ThemedText>
                        {item.description && (
                          <ThemedText style={styles.checklistDescription}>
                            {item.description}
                          </ThemedText>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Section Demandes Horaires */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>⏰ Demandes Horaires (Arrivée/Départ)</ThemedText>
          <View style={[styles.countBadge, demandesHoraires.length > 0 && styles.countBadgeWarning]}>
            <ThemedText style={styles.countBadgeText}>{demandesHoraires.length}</ThemedText>
          </View>
        </View>

        {demandesHoraires.length === 0 ? (
          <View style={styles.emptyBox}>
            <ThemedText style={styles.emptyBoxText}>Aucune demande d'horaire en attente</ThemedText>
          </View>
        ) : (
          <View style={styles.problemesContainer}>
            {demandesHoraires.map((demande) => {
              const resa = demande.reservation;
              const clientName = resa?.client_name || 'Client';
              const giteName = resa?.gite?.name || 'Gîte';
              const giteColor = resa?.gite?.color || '#636366';
              const typeLabel = demande.type === 'arrivee' ? '📥 Arrivée' : '📤 Départ';
              const typeColor = demande.type === 'arrivee' ? '#27AE60' : '#E74C3C';
              const dateDebut = resa?.check_in ? new Date(resa.check_in).toLocaleDateString('fr-FR') : 'N/A';
              const dateFin = resa?.check_out ? new Date(resa.check_out).toLocaleDateString('fr-FR') : 'N/A';

              return (
                <View key={demande.id} style={[styles.demandeCard, { borderLeftColor: typeColor }]}>
                  {/* En-tête */}
                  <View style={styles.demandeHeader}>
                    <View style={styles.demandeHeaderLeft}>
                      <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                        <ThemedText style={styles.typeBadgeText}>{typeLabel}</ThemedText>
                      </View>
                      <ThemedText style={styles.demandeClient}>{clientName}</ThemedText>
                      <View style={[styles.giteBadge, { backgroundColor: giteColor }]}>
                        <ThemedText style={styles.giteBadgeText}>{giteName}</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Infos */}
                  <View style={styles.demandeInfos}>
                    <ThemedText style={styles.demandeDate}>📅 {dateDebut} → {dateFin}</ThemedText>
                    <ThemedText style={styles.demandeHeure}>⏰ Demande: <ThemedText style={styles.demandeHeureValue}>{demande.heure_demandee}</ThemedText></ThemedText>
                    {demande.motif && <ThemedText style={styles.demandeMotif}>💬 {demande.motif}</ThemedText>}
                  </View>

                  {/* Boutons d'action */}
                  <View style={styles.demandeActions}>
                    <TouchableOpacity
                      style={styles.actionButtonValider}
                      onPress={() => validerDemandeHoraire(demande.id, demande.heure_demandee)}>
                      <ThemedText style={styles.actionButtonValiderText}>✓ Accepter</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButtonRefuser}
                      onPress={() => refuserDemandeHoraire(demande.id)}>
                      <ThemedText style={styles.actionButtonRefuserText}>✗ Refuser</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Section Retours Clients */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>💬 Retours Clients</ThemedText>
          <View style={[styles.countBadge, problemesSignales.length > 0 && styles.countBadgeWarning]}>
            <ThemedText style={styles.countBadgeText}>{problemesSignales.length}</ThemedText>
          </View>
        </View>

        {problemesSignales.length === 0 ? (
          <View style={styles.emptyBox}>
            <ThemedText style={styles.emptyBoxText}>Aucune demande en attente</ThemedText>
          </View>
        ) : (
          <View style={styles.problemesContainer}>
            {problemesSignales.map((probleme) => {
              const giteName = probleme.gite?.name || 'Gîte inconnu';
              const giteColor = probleme.gite?.color || '#636366';
              const urgenceLabel = probleme.urgence === 'haute' ? 'Haute' :
                                  probleme.urgence === 'basse' ? 'Basse' : 'Moyenne';
              const urgenceColor = probleme.urgence === 'haute' ? '#E74C3C' :
                                  probleme.urgence === 'basse' ? '#27AE60' : '#f39c12';
              const typeLabel = probleme.type === 'demande' ? '📩 Demande' :
                               probleme.type === 'retour' ? '💬 Retour' :
                               probleme.type === 'amelioration' ? '💡 Amélioration' : '⚠️ Problème';
              const dateStr = new Date(probleme.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });

              const showReponse = showReponseFor === probleme.id;

              return (
                <View key={probleme.id} style={[styles.problemeCard, { borderLeftColor: urgenceColor }]}>
                  {/* En-tête */}
                  <View style={styles.problemeHeader}>
                    <View style={styles.problemeHeaderLeft}>
                      <ThemedText style={styles.problemeType}>{typeLabel}</ThemedText>
                      <View style={[styles.giteBadge, { backgroundColor: giteColor }]}>
                        <ThemedText style={styles.giteBadgeText}>{giteName}</ThemedText>
                      </View>
                      {probleme.urgence && (
                        <View style={[styles.urgenceBadge, { backgroundColor: urgenceColor }]}>
                          <ThemedText style={styles.urgenceBadgeText}>{urgenceLabel}</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Contenu */}
                  <View style={styles.problemeContent}>
                    <ThemedText style={styles.problemeSujet}>{probleme.sujet}</ThemedText>
                    <ThemedText style={styles.problemeDescription}>{probleme.description}</ThemedText>
                    <ThemedText style={styles.problemeDate}>📅 {dateStr}</ThemedText>
                  </View>

                  {/* Boutons d'action */}
                  <View style={styles.problemeActions}>
                    <TouchableOpacity
                      style={styles.actionButtonRepondre}
                      onPress={() => setShowReponseFor(showReponse ? null : probleme.id)}>
                      <ThemedText style={styles.actionButtonRepondreText}>
                        💬 {showReponse ? 'Masquer' : 'Répondre'}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButtonTraite}
                      onPress={() => marquerCommeTraite(probleme.id)}>
                      <ThemedText style={styles.actionButtonTraiteText}>✓ Traité</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButtonSupprimer}
                      onPress={() => supprimerDemande(probleme.id)}>
                      <ThemedText style={styles.actionButtonSupprimerText}>🗑️</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Zone de réponse */}
                  {showReponse && (
                    <View style={styles.reponseZone}>
                      <ThemedText style={styles.reponseLabel}>Votre réponse</ThemedText>
                      <TextInput
                        style={styles.reponseTextArea}
                        value={reponseText}
                        onChangeText={setReponseText}
                        multiline
                        numberOfLines={4}
                        placeholder={`Réponse concernant : "${probleme.sujet}"\nGîte : ${giteName}\n\n[Votre réponse ici]`}
                        placeholderTextColor="#636366"
                      />
                      <View style={styles.reponseButtons}>
                        <TouchableOpacity
                          style={styles.reponseButtonEnvoyer}
                          onPress={() => envoyerReponse(probleme.id)}>
                          <ThemedText style={styles.reponseButtonEnvoyerText}>Enregistrer la réponse</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.reponseButtonAnnuler}
                          onPress={() => {
                            setShowReponseFor(null);
                            setReponseText('');
                          }}>
                          <ThemedText style={styles.reponseButtonAnnulerText}>Annuler</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 60,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  paginationNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#1C1C1E',
    opacity: 0.3,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4FF',
  },
  paginationButtonTextDisabled: {
    color: '#8E8E93',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  resaCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 5,
    gap: 16,
  },
  resaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  resaInfo: {
    flex: 1,
    gap: 6,
  },
  resaClient: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resaMeta: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailsButton: {
    backgroundColor: '#fdcb6e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    gap: 8,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#3A3A3C',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  detailsContainer: {
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#3A3A3C',
  },
  checklistsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checklistColumn: {
    flex: 1,
    gap: 8,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  checklistIcon: {
    fontSize: 16,
  },
  checklistItemText: {
    flex: 1,
    gap: 2,
  },
  checklistLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  checklistLabelCompleted: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  checklistDescription: {
    fontSize: 11,
    color: '#636366',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  horaireCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  horaireHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horaireTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  horaireTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00D4FF',
  },
  // Section Retours Clients
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: '#3A3A3C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeWarning: {
    backgroundColor: '#f39c12',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyBox: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyBoxText: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  problemesContainer: {
    gap: 12,
  },
  problemeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 5,
    gap: 12,
  },
  problemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2C2C2E',
  },
  problemeHeaderLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  problemeType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  giteBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  giteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  urgenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  urgenceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  problemeContent: {
    gap: 6,
  },
  problemeSujet: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  problemeDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  problemeDate: {
    fontSize: 11,
    color: '#636366',
    marginTop: 4,
  },
  problemeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonRepondre: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonRepondreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonTraite: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonTraiteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonSupprimer: {
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSupprimerText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  reponseZone: {
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#2C2C2E',
    gap: 10,
  },
  reponseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reponseTextArea: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3A3A3C',
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reponseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reponseButtonEnvoyer: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reponseButtonEnvoyerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reponseButtonAnnuler: {
    backgroundColor: '#636366',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  reponseButtonAnnulerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Styles demandes horaires
  demandeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 5,
    gap: 12,
    marginBottom: 12,
  },
  demandeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  demandeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demandeClient: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demandeInfos: {
    gap: 6,
  },
  demandeDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  demandeHeure: {
    fontSize: 13,
    color: '#8E8E93',
  },
  demandeHeureValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00D4FF',
  },
  demandeMotif: {
    fontSize: 12,
    color: '#636366',
    fontStyle: 'italic',
  },
  demandeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonValider: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonValiderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonRefuser: {
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonRefuserText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
