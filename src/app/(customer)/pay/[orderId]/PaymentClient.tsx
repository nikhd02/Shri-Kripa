/**
 * src/app/(customer)/pay/[orderId]/PaymentClient.tsx
 *
 * Interactive Client Component for Customer Online Payment via Razorpay.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UtensilsCrossed,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderItemDTO {
  id: string;
  name: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  specialInstructions: string | null;
}

interface SerializedOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  notes: string | null;
  subtotal: string;
  taxAmount: string;
  total: string;
  createdAt: string;
  tableNumber: string | null;
  isPaid: boolean;
  paymentReference: string | null;
  paymentMethod: string | null;
  items: OrderItemDTO[];
}

interface PaymentClientProps {
  order: SerializedOrder;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentClient({ order }: PaymentClientProps) {
  const [isPaid, setIsPaid] = useState<boolean>(order.isPaid);
  const [paymentRef, setPaymentRef] = useState<string | null>(order.paymentReference);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayNow = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create Razorpay order via backend API
      const createRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        setErrorMessage(
          createData.error || 'Failed to initiate payment gateway. Please contact restaurant.'
        );
        setIsProcessing(false);
        return;
      }

      // 2. Ensure Razorpay checkout script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage('Unable to load Razorpay payment SDK. Please check your connection.');
        setIsProcessing(false);
        return;
      }

      // 3. Configure Razorpay modal
      const options = {
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        name: 'Shree Kripa Family Restaurant',
        description: `Order #${order.orderNumber}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: order.customerName || '',
          contact: order.customerPhone || '',
        },
        theme: {
          color: '#7B1D1D',
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          setIsProcessing(true);
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setIsPaid(true);
              setPaymentRef(response.razorpay_payment_id);
            } else {
              setErrorMessage(
                verifyData.error ||
                  'Payment was captured by bank, but signature verification encountered an issue. Staff will manually confirm.'
              );
            }
          } catch (verifyErr) {
            console.error('[PaymentClient] Verification fetch failed:', verifyErr);
            setErrorMessage('Network error while confirming payment status with server.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (failResp: any) {
        setErrorMessage(
          failResp.error?.description || 'Payment was declined or cancelled. Please try again.'
        );
        setIsProcessing(false);
      });

      razorpayInstance.open();
    } catch (err: unknown) {
      console.error('[PaymentClient] Error launching checkout:', err);
      setErrorMessage('Unexpected error starting payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] pt-24 pb-20 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B1D1D]/10 border border-[#7B1D1D]/20 text-[#7B1D1D] text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5 text-[#C9A84C]" />
            Secure Online Payment
          </span>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#7B1D1D]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Shree Kripa Family Restaurant
          </h1>
          <p className="text-xs text-[#241512]/70">
            Akhari Bypass, Near Flyover, Varanasi • 100% Pure Vegetarian
          </p>
        </div>

        {/* Payment Success View */}
        {isPaid ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-300 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1.5">
                Payment Received & Verified
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#7B1D1D]">
                Thank you for your payment!
              </h2>
              <p className="text-xs text-[#241512]/75 max-w-sm mx-auto mt-1">
                Your online payment has been confirmed. The kitchen has been authorized to start preparing your dishes.
              </p>
            </div>

            {/* Bill Receipt Card */}
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#C9A84C]/30 text-left space-y-2.5 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-[#ebdcd0]">
                <span className="text-gray-500">Order Number:</span>
                <span className="font-mono font-bold text-[#7B1D1D] text-sm">
                  {order.orderNumber}
                </span>
              </div>

              {order.tableNumber && (
                <div className="flex justify-between pb-1.5 border-b border-[#ebdcd0]">
                  <span className="text-gray-500">Dining Table:</span>
                  <span className="font-bold text-[#241512]">Table {order.tableNumber}</span>
                </div>
              )}

              {paymentRef && (
                <div className="flex justify-between pb-1.5 border-b border-[#ebdcd0]">
                  <span className="text-gray-500">Razorpay Ref:</span>
                  <span className="font-mono font-bold text-emerald-800">{paymentRef}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-[#7B1D1D] pt-1">
                <span>Amount Paid:</span>
                <span>₹{Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="w-full sm:w-auto bg-[#7B1D1D] hover:bg-[#521212] text-white font-bold text-xs h-9">
                <Link href="/menu">Explore Restaurant Menu</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto border-[#C9A84C]/50 text-[#7B1D1D] hover:bg-[#FFF8F0] text-xs h-9">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9A84C]/40 shadow-xl space-y-6">
            
            {/* Status Alert Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  Order Accepted by Manager • Payment Pending
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Please complete payment to authorize our kitchen staff to begin food preparation.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Order Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                    Order Reference
                  </span>
                  <span className="font-mono font-bold text-base text-[#7B1D1D]">
                    {order.orderNumber}
                  </span>
                </div>
                {order.tableNumber && (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-[#7B1D1D] text-xs font-bold rounded-lg">
                    Table {order.tableNumber}
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Dishes ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-xl bg-[#FFFDF9] border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold text-[#241512]">
                          {it.quantity}x {it.name}
                        </span>
                        {it.variantName && (
                          <span className="text-[11px] text-[#7B1D1D] ml-1 font-semibold">
                            ({it.variantName})
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[#241512] flex-shrink-0">
                        ₹{Number(it.lineTotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{Number(order.subtotal).toFixed(2)}</span>
                </div>
                {Number(order.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>₹{Number(order.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-base text-[#7B1D1D]">
                  <span>Total Amount Payable:</span>
                  <span>₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7B1D1D] to-[#521212] hover:from-[#661818] hover:to-[#3e0d0d] text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E0C278]" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#E0C278]" />
                    <span>Pay ₹{Number(order.total).toFixed(2)} Now via Razorpay</span>
                    <ArrowRight className="w-4 h-4 text-[#E0C278]" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Secured
                </span>
                <span>•</span>
                <span>UPI, Cards, NetBanking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
