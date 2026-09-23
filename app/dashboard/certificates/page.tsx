import { requirePagePermission } from "@/lib/auth/guards";
import CertificatesClient from "./CertificatesClient";

export default async function CertificatesPage() {
  await requirePagePermission("certificates.view");
  return <CertificatesClient />;
}
