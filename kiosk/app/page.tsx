import { redirect } from "next/navigation";

export default function RootRedirect() {
  redirect("/menu-selector");
  return null;
}
