import {
  Banknote,
  ClipboardList,
  Container,
  Download,
  FileText,
  Filter,
  Gavel,
  Handshake,
  MapPin,
  Package,
  ReceiptText,
  Route,
  ScanLine,
  ScrollText,
  Signature,
  Stamp,
  Tag,
  TriangleAlert,
  Truck,
  Upload,
  Warehouse,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * Product-concept icons from DESIGN.md §3.11.
 * Generic UI glyphs (chevrons, close, check, search, plus) are not in this map.
 */
export const ICON = {
  document: FileText,
  invoice: ReceiptText,
  billOfLading: ScrollText,
  manifest: ClipboardList,
  proofOfDelivery: Signature,
  customsEntry: Stamp,
  rate: Tag,
  spotQuote: Gavel,
  contractRate: Handshake,
  payment: Banknote,
  shipment: Package,
  carrier: Truck,
  container: Container,
  lane: Route,
  stop: MapPin,
  dockOrFacility: Warehouse,
  exception: TriangleAlert,
  import: Upload,
  export: Download,
  scan: ScanLine,
  filter: Filter,
} satisfies Record<string, LucideIcon>

export type IconConcept = keyof typeof ICON

export const ICON_LABELS: Record<IconConcept, string> = {
  document: "Document",
  invoice: "Invoice",
  billOfLading: "Bill of lading",
  manifest: "Manifest",
  proofOfDelivery: "Proof of delivery",
  customsEntry: "Customs entry",
  rate: "Rate",
  spotQuote: "Spot quote",
  contractRate: "Contract rate",
  payment: "Payment",
  shipment: "Shipment",
  carrier: "Carrier",
  container: "Container",
  lane: "Lane",
  stop: "Stop",
  dockOrFacility: "Dock or facility",
  exception: "Exception",
  import: "Import",
  export: "Export",
  scan: "Scan",
  filter: "Filter",
}

/** Families name concepts that are easily confused and need distinct silhouettes. */
export const ICON_FAMILIES = {
  paperwork: [
    "document",
    "invoice",
    "billOfLading",
    "manifest",
    "proofOfDelivery",
    "customsEntry",
  ],
  pricesAndMoney: ["invoice", "rate", "spotQuote", "contractRate", "payment"],
  freightAndPlaces: [
    "shipment",
    "carrier",
    "container",
    "lane",
    "stop",
    "dockOrFacility",
  ],
  work: ["exception", "import", "export", "scan", "filter"],
} as const satisfies Record<string, readonly IconConcept[]>