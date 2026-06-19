'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Settings2, ShieldCheck, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    store_name: '',
    support_email: '',
    maintenance_mode: false,
    require_email_verification: true
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.client.get('/users/admin/settings/')
      setSettings(response.data)
    } catch (error) {
      console.error("Failed to fetch settings", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.client.patch('/users/admin/settings/', settings)
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings", error)
      alert("Error saving settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Configuration</p>
          <h1 className="text-3xl font-display font-bold text-foreground">Store Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure global parameters and security.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-md">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="border border-border rounded-md bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm">
                <Settings2 className="w-4 h-4 text-accent" /> Branding
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input
                  className="rounded-md"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  className="rounded-md"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Label>Maintenance Mode</Label>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(val) => setSettings({ ...settings, maintenance_mode: val })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="border border-border rounded-md bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-accent" /> Access Control
              </h2>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <Label>Require Email Verification</Label>
                <Switch
                  checked={settings.require_email_verification}
                  onCheckedChange={(val) => setSettings({ ...settings, require_email_verification: val })}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
