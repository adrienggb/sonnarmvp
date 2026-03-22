# Schema Airtable — Sonnar Automated Reporting

## Tables

### Missions
| Champ | Type | Notes |
|-------|------|-------|
| `name` | Single line text | Ex : "VP Sales - Fintech Scale-up" |
| `client_name` | Single line text | |
| `client_email` | Email | Destinataire du report hebdo |
| `client_portal_url` | URL | Lien GitHub Pages partagé au client |
| `report_frequency` | Single Select | `weekly` / `biweekly` |
| `last_report_sent_at` | Date | Mis à jour par n8n après chaque envoi |
| `consultant_id` | Link to Consultants | |
| `status` | Single Select | `active` / `paused` / `closed` |
| `persona_target` | Long text | Critères d'évaluation + profil recherché |
| `salary_range` | Single line text | Ex : "120-150k€ fixe" |
| `location` | Single line text | |

---

### Candidates
| Champ | Type | Notes |
|-------|------|-------|
| `name` | Single line text | |
| `linkedin_url` | URL | |
| `current_title` | Single line text | |
| `current_company` | Single line text | |
| `nb_direct_reports` | Number | Extrait automatiquement du CR |
| `availability_date` | Date | Extrait automatiquement du CR |
| `salary_current` | Number | En k€/an |
| `salary_target` | Number | En k€/an |
| `location` | Single line text | |
| `ai_extracted_fields_log` | Long text | JSON brut de la dernière extraction IA |

---

### Pipeline
| Champ | Type | Notes |
|-------|------|-------|
| `mission_id` | Link to Missions | |
| `candidate_id` | Link to Candidates | |
| `pipeline_stage` | **Single Select** | **ENUM STRICT — 12 valeurs :** `Sourced` `Contacted` `Responded` `Call Done` `Qualified` `Presented` `E1` `E2` `E3` `Offer` `Accepted` `Rejected` |
| `stage_changed_at` | Last Modified Time | Filtré sur `pipeline_stage` uniquement |
| `notes` | Long text | Notes libres du consultant |

> ⚠️ `pipeline_stage` doit être un Single Select strict — jamais de texte libre. Prérequis bloquant pour les KPIs auto-calculés (PRD-01, PRD-04).

---

### Qualifications
| Champ | Type | Notes |
|-------|------|-------|
| `pipeline_id` | Link to Pipeline | |
| `interview_date` | Date | |
| `raw_transcript` | Long text | Transcription brute (input consultant) |
| `ai_generated_cr` | Long text | JSON stringifié du CR généré par Claude |
| `ai_suggested_score` | Number | Score 1-5 suggéré par Claude |
| `consultant_final_score` | Number | Score validé/modifié par le consultant |
| `cr_source` | Single Select | `manual` / `ai` |
| `consultant_edited` | Checkbox | True si le consultant a modifié le CR IA |

---

### Report_Log
| Champ | Type | Notes |
|-------|------|-------|
| `mission_id` | Link to Missions | |
| `sent_at` | Date | |
| `week_label` | Single line text | Ex : "Semaine du 17 mars 2025" |
| `report_content` | Long text | Corps de l'email généré |
| `kpi_snapshot` | Long text | JSON des KPIs au moment de la génération |
| `consultant_edited` | Checkbox | True si modifié avant envoi |

---

### Consultants
| Champ | Type |
|-------|------|
| `name` | Single line text |
| `email` | Email |
| `slack_user_id` | Single line text |

---

## Formules KPI (Rollup sur Missions)

```
nb_sourced     = COUNT(Pipeline where stage = "Sourced")
nb_contacted   = COUNT(Pipeline where stage = "Contacted")
nb_responded   = COUNT(Pipeline where stage = "Responded")
nb_call_done   = COUNT(Pipeline where stage = "Call Done")
nb_qualified   = COUNT(Pipeline where stage = "Qualified")
nb_presented   = COUNT(Pipeline where stage = "Presented")
nb_in_process  = nb_e1 + nb_e2 + nb_e3

conversion_contact_response  = nb_responded / nb_contacted (%)
conversion_call_qualified    = nb_qualified / nb_call_done (%)
conversion_qualified_pres    = nb_presented / nb_qualified (%)
```
