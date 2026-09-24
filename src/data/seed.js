/**
 * Dummy inventory. Field names deliberately match the JSON in the assignment's
 * "Implementation Examples" document, so the real API can return these shapes
 * verbatim and nothing in the UI needs to change.
 *
 * Unknown values are null, never invented — same rule the AI prompt enforces.
 */

export const CURRENT_USER = {
  sub: 'a1b2c3d4-user-jordan',
  name: 'Jordan Ellis',
  email: 'j.ellis@northgate.example.org',
  department: 'Facilities & IT',
  groups: ['Technician'],
};

export const DIRECTORY = {
  'a1b2c3d4-user-jordan': 'Jordan Ellis',
  'b2c3d4e5-user-priya': 'Priya Raman',
  'c3d4e5f6-user-tom': 'Tom Okafor',
  'd4e5f6a7-user-sian': 'Siân Whitlock',
};

export const CATEGORIES = [
  'Laptop', 'Desktop', 'Monitor', 'Server', 'Networking', 'Printer',
  'Projector', 'Vehicle', 'Mobile device', 'Tablet', 'Power tool',
  'Lab equipment', 'Other',
];

export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Unserviceable'];

export const STATUSES = [
  'Available', 'Assigned', 'Checked Out', 'In Maintenance',
  'Damaged', 'Lost', 'Stolen', 'Retired',
];

export const USAGE_LEVELS = ['Occasional', 'Weekly', 'Daily', 'Continuous'];

export const ENVIRONMENTS = [
  'Indoor office', 'Indoor classroom', 'Workshop', 'Server room',
  'Outdoor', 'Vehicle', 'Storage',
];

const asset = (o) => ({
  model: null,
  serialNumber: null,
  depreciationMethod: 'straight-line',
  assignedUserId: null,
  reviewStatus: 'UserConfirmed',
  imageKey: null,
  lastCleaningDate: null,
  lastMaintenanceDate: null,
  nextMaintenanceDue: null,
  ...o,
});

export const SEED_ASSETS = [
  asset({
    assetId: 'AST-0001', assetTag: 'NG-IT-1041', category: 'Laptop',
    description: 'Business laptop with a black chassis, used for teaching prep',
    manufacturer: 'Dell', model: 'Latitude 5440', serialNumber: 'J7KQ2P3',
    purchaseDate: '2024-09-01', inServiceDate: '2024-09-01',
    purchaseValue: '1500.00', salvageValue: '100.00', usefulLifeMonths: 48,
    assignedUserId: 'a1b2c3d4-user-jordan', department: 'Facilities & IT',
    location: { building: 'Mesquite Hall', room: '319' },
    condition: 'Good', status: 'Assigned', usageLevel: 'Daily',
    environment: 'Indoor office',
    lastCleaningDate: '2026-08-15', lastMaintenanceDate: '2026-08-15',
    nextMaintenanceDue: '2026-11-13',
  }),
  asset({
    assetId: 'AST-0014', assetTag: 'NG-IT-1188', category: 'Monitor',
    description: 'Dual-input 27 inch desk monitor on an articulated arm',
    manufacturer: 'Dell', model: 'U2723QE',
    purchaseDate: '2023-02-10', inServiceDate: '2023-02-20',
    purchaseValue: '520.00', salvageValue: '40.00', usefulLifeMonths: 60,
    assignedUserId: 'a1b2c3d4-user-jordan', department: 'Facilities & IT',
    location: { building: 'Mesquite Hall', room: '319' },
    condition: 'Excellent', status: 'Assigned', usageLevel: 'Daily',
    environment: 'Indoor office',
    lastCleaningDate: '2026-06-02', nextMaintenanceDue: '2027-06-02',
  }),
  asset({
    assetId: 'AST-0021', assetTag: 'NG-MOB-0442', category: 'Mobile device',
    description: 'Duty phone carried by the on-call facilities technician',
    manufacturer: 'Apple', model: 'iPhone 13',
    purchaseDate: '2022-11-04', inServiceDate: '2022-11-04',
    purchaseValue: '780.00', salvageValue: '90.00', usefulLifeMonths: 36,
    assignedUserId: 'a1b2c3d4-user-jordan', department: 'Facilities & IT',
    location: { building: 'Mesquite Hall', room: 'Mobile' },
    condition: 'Fair', status: 'Assigned', usageLevel: 'Continuous',
    environment: 'Outdoor',
    lastMaintenanceDate: '2025-10-01', nextMaintenanceDue: '2026-09-05',
  }),
  asset({
    assetId: 'AST-0033', assetTag: 'NG-NET-0012', category: 'Networking',
    description: '48-port managed switch serving the third-floor teaching rooms',
    manufacturer: 'Cisco', model: 'Catalyst 9200', serialNumber: 'FOC2410L8QP',
    purchaseDate: '2021-06-15', inServiceDate: '2021-07-01',
    purchaseValue: '4200.00', salvageValue: '300.00', usefulLifeMonths: 84,
    department: 'Facilities & IT',
    location: { building: 'Mesquite Hall', room: 'Comms 2' },
    condition: 'Good', status: 'Assigned', usageLevel: 'Continuous',
    environment: 'Server room',
    lastCleaningDate: '2026-03-11', lastMaintenanceDate: '2026-03-11',
    nextMaintenanceDue: '2026-09-11',
  }),
  asset({
    assetId: 'AST-0042', assetTag: 'NG-AV-0207', category: 'Projector',
    description: 'Ceiling-mounted teaching projector with a replaceable filter',
    manufacturer: 'Epson', model: 'EB-2250U',
    purchaseDate: '2020-08-20', inServiceDate: '2020-09-01',
    purchaseValue: '1850.00', salvageValue: '120.00', usefulLifeMonths: 72,
    department: 'Teaching Services',
    location: { building: 'Alder Building', room: '104' },
    condition: 'Fair', status: 'Assigned', usageLevel: 'Daily',
    environment: 'Indoor classroom',
    lastCleaningDate: '2026-02-18', lastMaintenanceDate: '2026-02-18',
    nextMaintenanceDue: '2026-08-18',
  }),
  asset({
    assetId: 'AST-0050', assetTag: 'NG-LAB-0031', category: 'Lab equipment',
    description: 'Filament 3D printer used by the design technology group',
    manufacturer: 'Prusa', model: 'MK4',
    purchaseDate: '2024-01-12', inServiceDate: '2024-02-01',
    purchaseValue: '1100.00', salvageValue: '80.00', usefulLifeMonths: 60,
    assignedUserId: 'c3d4e5f6-user-tom', department: 'Design Technology',
    location: { building: 'Alder Building', room: 'Workshop 2' },
    condition: 'Fair', status: 'In Maintenance', usageLevel: 'Weekly',
    environment: 'Workshop',
    lastCleaningDate: '2026-07-20', lastMaintenanceDate: '2026-09-02',
    nextMaintenanceDue: '2026-12-01',
  }),
  asset({
    assetId: 'AST-0058', assetTag: 'NG-PRN-0093', category: 'Printer',
    description: 'Shared mono laser printer for the ground-floor office',
    manufacturer: 'HP', model: 'LaserJet M507',
    purchaseDate: '2022-04-05', inServiceDate: '2022-04-05',
    purchaseValue: '640.00', salvageValue: '50.00', usefulLifeMonths: 60,
    department: 'Administration',
    location: { building: 'Mesquite Hall', room: '102' },
    condition: 'Good', status: 'Available', usageLevel: 'Daily',
    environment: 'Indoor office',
    lastCleaningDate: '2026-05-30', nextMaintenanceDue: '2026-11-30',
  }),
  asset({
    assetId: 'AST-0061', assetTag: 'NG-SRV-0004', category: 'Server',
    description: 'Rack server hosting the student file shares',
    manufacturer: 'Dell', model: 'PowerEdge R650', serialNumber: '8JK2LM3',
    purchaseDate: '2023-05-22', inServiceDate: '2023-06-01',
    purchaseValue: '9400.00', salvageValue: '600.00', usefulLifeMonths: 60,
    department: 'Facilities & IT',
    location: { building: 'Mesquite Hall', room: 'Comms 1' },
    condition: 'Excellent', status: 'Assigned', usageLevel: 'Continuous',
    environment: 'Server room',
    lastCleaningDate: '2026-04-14', lastMaintenanceDate: '2026-04-14',
    nextMaintenanceDue: '2026-10-14',
  }),
  asset({
    assetId: 'AST-0066', assetTag: 'NG-TAB-0150', category: 'Tablet',
    description: 'Loan tablet from the library short-term pool',
    manufacturer: 'Apple', model: 'iPad 10th gen',
    purchaseDate: '2025-01-15', inServiceDate: '2025-01-15',
    purchaseValue: '430.00', salvageValue: '45.00', usefulLifeMonths: 36,
    department: 'Library Services',
    location: { building: 'Alder Building', room: 'Loans desk' },
    condition: 'Good', status: 'Available', usageLevel: 'Occasional',
    environment: 'Indoor office',
    lastCleaningDate: '2026-09-01', nextMaintenanceDue: '2027-03-01',
  }),
  asset({
    assetId: 'AST-0070', assetTag: 'NG-TL-0288', category: 'Power tool',
    description: 'Cordless drill set with two batteries and a charging base',
    manufacturer: 'Makita', model: null,
    purchaseDate: '2021-09-30', inServiceDate: '2021-10-01',
    purchaseValue: '310.00', salvageValue: '25.00', usefulLifeMonths: 60,
    department: 'Facilities & IT',
    location: { building: 'Yard', room: 'Tool crib' },
    condition: 'Poor', status: 'Damaged', usageLevel: 'Weekly',
    environment: 'Workshop',
    lastMaintenanceDate: '2026-01-08', nextMaintenanceDue: '2026-07-08',
  }),
];

export const SEED_MAINTENANCE = [
  {
    maintenanceId: 'MNT-0001', assetId: 'AST-0001', performedDate: '2026-08-15',
    maintenanceType: 'Cleaning',
    notes: 'Removed external dust and inspected ventilation openings.',
    performedBy: 'a1b2c3d4-user-jordan', cost: '25.00', conditionAfterService: 'Good',
  },
  {
    maintenanceId: 'MNT-0002', assetId: 'AST-0001', performedDate: '2025-09-02',
    maintenanceType: 'Repair',
    notes: 'Replaced the cooling fan after two reported overheating shutdowns.',
    performedBy: 'c3d4e5f6-user-tom', cost: '88.50', conditionAfterService: 'Good',
  },
  {
    maintenanceId: 'MNT-0003', assetId: 'AST-0042', performedDate: '2026-02-18',
    maintenanceType: 'Cleaning',
    notes: 'Filter washed and refitted. Lamp hours logged at 2,740.',
    performedBy: 'a1b2c3d4-user-jordan', cost: '0.00', conditionAfterService: 'Fair',
  },
  {
    maintenanceId: 'MNT-0004', assetId: 'AST-0050', performedDate: '2026-09-02',
    maintenanceType: 'Repair',
    notes: 'Nozzle replaced and bed re-levelled. Awaiting test print sign-off.',
    performedBy: 'c3d4e5f6-user-tom', cost: '42.00', conditionAfterService: 'Fair',
  },
  {
    maintenanceId: 'MNT-0005', assetId: 'AST-0070', performedDate: '2026-01-08',
    maintenanceType: 'Inspection',
    notes: 'Chuck slipping under load. Withdrawn from service pending a decision.',
    performedBy: 'd4e5f6a7-user-sian', cost: '0.00', conditionAfterService: 'Poor',
  },
];

/**
 * A maintenance recommendation is stored separately from what actually
 * happened, and stays PendingApproval until a technician signs it off.
 */
export const SEED_RECOMMENDATIONS = [
  {
    recommendationId: 'REC-0001', assetId: 'AST-0042', generatedAt: '2026-09-10',
    priority: 'High',
    recommendedAction: 'Clean the optical filter and inspect the cooling fans.',
    suggestedIntervalDays: 90,
    replacementRecommendation: 'Review during the next annual equipment assessment.',
    reason:
      'The asset is used daily in a classroom, is six years old, and its last recorded cleaning was more than six months ago.',
    limitations: [
      'No manufacturer-specific maintenance schedule was supplied.',
      'The proposed interval is a planning suggestion, not a validated failure prediction.',
    ],
    requiresApproval: true,
    approvalStatus: 'PendingApproval',
  },
  {
    recommendationId: 'REC-0002', assetId: 'AST-0001', generatedAt: '2026-08-16',
    priority: 'Medium',
    recommendedAction: 'Inspect ventilation openings and clean to the approved procedure.',
    suggestedIntervalDays: 90,
    replacementRecommendation: 'No replacement indicated at this time.',
    reason: 'The asset is used daily and has a recorded history of dust accumulation.',
    limitations: ['Mechanical wear cannot be assessed from the maintenance log alone.'],
    requiresApproval: true,
    approvalStatus: 'Approved',
    approvedBy: 'a1b2c3d4-user-jordan',
    approvedAt: '2026-08-16',
  },
];

/**
 * Canned Bedrock responses. Shapes match the assignment's prompt contract
 * exactly, including nulls for anything a photograph cannot establish.
 */
export const AI_FIXTURES = {
  vehicle: {
    identificationStatus: 'suggestion_available',
    category: 'Vehicle',
    manufacturer: 'Ford',
    model: null,
    description:
      'White medium panel van with a sliding nearside door, roof bars and an organisation livery on the driver-side panel.',
    visibleConditionNotes:
      'Light scuffing along the front bumper and a shallow dent above the rear wheel arch. Tyres appear seated and inflated.',
    suggestedUsefulLifeMonths: 96,
    suggestedMaintenanceCategory: 'Vehicle servicing',
    reviewNotes: [
      'The exact model and trim level are not readable from this angle.',
      'The registration plate is partly obscured, so it has not been recorded.',
      'Mechanical condition and mileage cannot be determined from a photograph.',
    ],
  },
  unclear: {
    identificationStatus: 'manual_entry_required',
    category: null,
    manufacturer: null,
    model: null,
    description: null,
    visibleConditionNotes: null,
    suggestedUsefulLifeMonths: null,
    suggestedMaintenanceCategory: null,
    reviewNotes: ['The photograph is too blurry to identify the asset.'],
  },
};
