
/*
 * Layout-Struktur zentralisiert – keine eigenen Layout-Komponenten mehr verwenden. 
 * Änderungen nur nach Rücksprache.
 */

import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Calendar } from "lucide-react"
import TrialBanner from "@/components/TrialBanner"
import { useTranslation } from "react-i18next"

/**
 * Erfolgs‑Seite nach einem erfolgreichen Stripe‑Checkout.
 *  - zeigt 14‑tägige Trial‑Info
 *  - liest die session_id für Debug‑/Support‑Zwecke aus der URL
 */
const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1_500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">{t('checkout.processing')}</p>
        </div>
      </div>
    )

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1_000)

  return (
    <main className="py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <TrialBanner daysRemaining={14} />

        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-black">{t('checkout.title')}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Trial‑Box */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">{t('checkout.trial')}</h3>
              <p className="text-gray-600 mb-4">
                {t('checkout.trialDescription')}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                <Calendar className="h-4 w-4" />
                <span>{t('checkout.trialEnds', { date: trialEndsAt.toLocaleDateString("de-DE") })}</span>
              </div>
            </div>

            {/* To‑Do Liste */}
            <div className="space-y-4 text-left">
              <h4 className="font-semibold text-center">{t('checkout.nextSteps')}</h4>
              {(t('checkout.steps', { returnObjects: true }) as Array<{title: string, desc: string}>).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-6 border-t">
              <Link to="/dashboard">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                  {t('checkout.toDashboard')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {sessionId && (
              <div className="text-xs text-gray-400 pt-4 border-t break-all select-all">
                Session ID: {sessionId}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default CheckoutSuccess
