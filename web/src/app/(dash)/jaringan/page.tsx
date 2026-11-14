import { Jaringan } from "@/components/pages/Jaringan";

// Dashboard dirender di klien setelah data JSON dimuat; tidak ada konten server untuk validasi instant navigation.
export const instant = false;

export default function Page() {
  return <Jaringan />;
}
