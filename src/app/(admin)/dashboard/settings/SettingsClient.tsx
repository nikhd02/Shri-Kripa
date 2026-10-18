'use client';
/**
 * src/app/(admin)/dashboard/settings/SettingsClient.tsx
 * Client component for managing restaurant profile, operating info,
 * public location, and ordering/tax configuration.
 */

import React, { useState, useTransition } from 'react';
import {
  Settings,
  Building2,
  Clock,
  MapPin,
  Receipt,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { updateRestaurantSettingsAction, type SettingsDTO } from '@/server/actions/settings';

interface SettingsClientProps {
  initialSettings: SettingsDTO;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();

  // Form State
  const [restaurantName, setRestaurantName] = useState(initialSettings.restaurantName);
  const [phone1, setPhone1] = useState(initialSettings.phone1 || '');
  const [phone2, setPhone2] = useState(initialSettings.phone2 || '');
  const [address, setAddress] = useState(initialSettings.address || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialSettings.googleMapsUrl || '');
  const [openingHours, setOpeningHours] = useState(initialSettings.openingHours || '');
  const [timezone, setTimezone] = useState(initialSettings.timezone || 'Asia/Kolkata');
  const [taxRate, setTaxRate] = useState(String(initialSettings.taxRate));
  const [taxLabel, setTaxLabel] = useState(initialSettings.taxLabel || 'GST');
  const [currency, setCurrency] = useState(initialSettings.currency || 'INR');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleReset = () => {
    setRestaurantName(initialSettings.restaurantName);
    setPhone1(initialSettings.phone1 || '');
    setPhone2(initialSettings.phone2 || '');
    setAddress(initialSettings.address || '');
    setGoogleMapsUrl(initialSettings.googleMapsUrl || '');
    setOpeningHours(initialSettings.openingHours || '');
    setTimezone(initialSettings.timezone || 'Asia/Kolkata');
    setTaxRate(String(initialSettings.taxRate));
    setTaxLabel(initialSettings.taxLabel || 'GST');
    setCurrency(initialSettings.currency || 'INR');
    setFieldErrors({});
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFeedback(null);

    const parsedTaxRate = parseFloat(taxRate);
    if (isNaN(parsedTaxRate)) {
      setFieldErrors({ taxRate: ['Tax rate must be a valid number'] });
      return;
    }

    startTransition(async () => {
      const res = await updateRestaurantSettingsAction({
        restaurantName,
        phone1,
        phone2,
        address,
        googleMapsUrl,
        openingHours,
        timezone,
        taxRate: parsedTaxRate,
        taxLabel,
        currency,
      });

      if (res.success && res.data) {
        setFeedback({
          type: 'success',
          message: 'Restaurant settings updated and applied successfully across all customer channels!',
        });
      } else {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        } else if (res.error) {
          setFeedback({ type: 'error', message: res.error });
        }
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Restaurant Settings
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Configure restaurant identity, contact details, operating schedule, and tax rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            type="submit"
            form="settings-form"
            loading={isPending}
            size="sm"
            className="gap-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          )}
          <div className="flex-1 text-sm font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Restaurant Profile */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  Restaurant Profile
                </CardTitle>
                <CardDescription className="text-xs">
                  Official establishment branding and primary contact numbers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-4">
            <Input
              label="Restaurant Legal / Display Name"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              placeholder="Shree Kripa Family Restaurant & Banquet"
              error={fieldErrors.restaurantName?.[0]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Phone Number"
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                required
                placeholder="e.g. 9415268463"
                hint="Displayed on headers, public menu, and order receipts."
                error={fieldErrors.phone1?.[0]}
              />

              <Input
                label="Secondary Phone Number (Optional)"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="e.g. 9125669366"
                hint="Alternative line for catering & banquet inquiries."
                error={fieldErrors.phone2?.[0]}
              />
            </div>

            <Textarea
              label="Physical Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={2}
              placeholder="e.g. Akhari Bypass, Near Flyover, Varanasi"
              error={fieldErrors.address?.[0]}
            />
          </CardContent>
        </Card>

        {/* SECTION 2: Operating Schedule & Regional Timezone */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  Operating Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Dining hours and regional timezone formatting
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Opening Hours Display"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="e.g. 11:00 AM - 11:00 PM (Daily)"
                hint="Shown on customer website and contact pages."
                error={fieldErrors.openingHours?.[0]}
              />

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 uppercase tracking-wider">
                  Operational Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST — UTC+05:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                </select>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  Used for daily sales cutoffs and order timestamps.
                </p>
                {fieldErrors.timezone?.[0] && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.timezone[0]}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Public Website & Google Maps Location */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  Public Website & Maps Location
                </CardTitle>
                <CardDescription className="text-xs">
                  Google Maps integration for the customer &quot;Get Directions&quot; buttons
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-4">
            <div>
              <Input
                label="Google Maps URL"
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                hint="Verified link for Shree Kripa Family Restaurant & Banquet on Google Maps."
                error={fieldErrors.googleMapsUrl?.[0]}
              />
              {googleMapsUrl && (
                <div className="mt-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Test Google Maps link in new tab
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Ordering & Tax Configuration */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  Ordering & Tax Configuration
                </CardTitle>
                <CardDescription className="text-xs">
                  Applicable GST rates, tax labels, and billing currency
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                required
                placeholder="5"
                hint="Standard restaurant GST is 5%."
                error={fieldErrors.taxRate?.[0]}
              />

              <Input
                label="Tax Display Label"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                required
                placeholder="GST"
                hint="Printed on receipts (e.g. GST, VAT)."
                error={fieldErrors.taxLabel?.[0]}
              />

              <Input
                label="Currency Symbol"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                placeholder="INR"
                hint="Default transaction currency (INR / ₹)."
                error={fieldErrors.currency?.[0]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
          >
            Discard Unsaved
          </Button>
          <Button
            type="submit"
            loading={isPending}
            className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] px-6"
          >
            Save Restaurant Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
