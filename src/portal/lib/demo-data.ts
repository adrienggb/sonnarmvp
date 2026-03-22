import type { MissionData } from "./airtable";

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
