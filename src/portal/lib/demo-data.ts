import type { MissionData, ReportLog } from "./airtable";

export const DEMO_DATA: MissionData = {
  mission: {
    id: "demo",
    name: "VP Sales — Fintech Scale-up",
    clientName: "Sophie Marchand",
    status: "active",
    salaryRange: "130-160k€",
    location: "Paris, 2j remote",
    reportFrequency: "weekly",
  },
  pipeline: [
    { id: "p1", missionId: "demo", candidateId: "c1", stage: "E2", candidate: { id: "c1", name: "Julien Favre", currentTitle: "Director of Sales EMEA", currentCompany: "Stripe" } },
    { id: "p2", missionId: "demo", candidateId: "c2", stage: "Presented", candidate: { id: "c2", name: "Camille Nguyen", currentTitle: "VP Sales", currentCompany: "Spendesk" } },
    { id: "p3", missionId: "demo", candidateId: "c3", stage: "Qualified", candidate: { id: "c3", name: "Antoine Roux", currentTitle: "Head of Sales", currentCompany: "Qonto" } },
    { id: "p4", missionId: "demo", candidateId: "c4", stage: "Rejected", candidate: { id: "c4", name: "Sarah Dumas", currentTitle: "Sales Director", currentCompany: "Pennylane" } },
    { id: "p5", missionId: "demo", candidateId: "c5", stage: "Call Done", candidate: { id: "c5", name: "Nicolas Blanc", currentTitle: "VP Commercial", currentCompany: "Luko" } },
    { id: "p6", missionId: "demo", candidateId: "c6", stage: "Responded", candidate: { id: "c6", name: "Elodie Mercier", currentTitle: "Regional Sales Manager", currentCompany: "Adyen" } },
    { id: "p7", missionId: "demo", candidateId: "c7", stage: "Contacted", candidate: { id: "c7", name: "Romain Castillo", currentTitle: "Head of Revenue", currentCompany: "Payfit" } },
  ],
  stageCounts: {
    Sourced: 0, Contacted: 1, Responded: 1, "Call Done": 1,
    Qualified: 1, Presented: 1, E1: 0, E2: 1, E3: 0,
    Offer: 0, Accepted: 0, Rejected: 1,
  },
  presented: [
    { id: "p1", missionId: "demo", candidateId: "c1", stage: "E2", candidate: { id: "c1", name: "Julien Favre", currentTitle: "Director of Sales EMEA", currentCompany: "Stripe" } },
    { id: "p2", missionId: "demo", candidateId: "c2", stage: "Presented", candidate: { id: "c2", name: "Camille Nguyen", currentTitle: "VP Sales", currentCompany: "Spendesk" } },
  ],
  activeCount: 6,
  qualifiedCount: 4,
  presentedCount: 2,
};

export const DEMO_REPORT: ReportLog = {
  id: "demo-report",
  weekLabel: "Semaine du 17 mars 2025",
  sentAt: "2025-03-21",
  kpiSnapshot: {
    Sourced: 0, Contacted: 1, Responded: 1, "Call Done": 1,
    Qualified: 1, Presented: 1, E1: 0, E2: 1, E3: 0,
    Offer: 0, Accepted: 0, Rejected: 1,
  },
  reportContent: `## Avancement cette semaine

La mission VP Sales progresse selon le plan. Deux entretiens de qualification ont été menés cette semaine, portant le nombre de profils qualifiés à 4 au total.

## Pipeline actuel

- **6 candidats actifs** dans le pipeline
- **4 qualifiés** dont 2 présentés au client
- 1 candidat en phase E2 (entretien approfondi Sonnar)
- 1 rejet suite à désalignement salarial

## Candidats rencontrés

- **Julien Favre** (Director of Sales EMEA, Stripe) : profil senior très aligné — 12 ans de vente SaaS, management de 22 personnes, expérience scale-up en phase de croissance. Recommandation go. Score 4.5/5.
- **Camille Nguyen** (VP Sales, Spendesk) : profil solide sur le volet équipe et process, plus faible sur la composante technico-commerciale B2B fintech. À revoir selon priorité client.

## Prochaines étapes

- Planification des entretiens client pour Julien Favre la semaine du 24 mars
- Qualification d'Antoine Roux (Head of Sales, Qonto) en cours de planification
- Point de cadrage avec vous prévu jeudi 27 mars`,
};
