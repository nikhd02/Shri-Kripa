/**
 * src/app/(admin)/dashboard/kitchen/page.tsx
 * Admin redirect page to the dedicated Kitchen Display System.
 */

import { redirect } from 'next/navigation';

export default function DashboardKitchenRedirect() {
  redirect('/kitchen');
}
