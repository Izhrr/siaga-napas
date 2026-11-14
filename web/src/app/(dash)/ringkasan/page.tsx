import { Ringkasan } from "@/components/pages/Ringkasan";

// Dashboard dirender di klien setelah data JSON dimuat; tidak ada konten server untuk validasi instant navigation.
export const instant = false;

export default function Page() {
  return <Ringkasan />;
}
