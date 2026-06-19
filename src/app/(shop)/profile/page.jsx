'use client'

import { useState } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
}

export default function ProfilePage() {
  const { isLoading, isAuthorized } = useRequireAuth()
  const { user, updateProfile, roleConfirmed } = useAuthStore()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const handleEditClick = () => {
    setFormData({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      phone: user?.phone || '',
      address: user?.profile?.address_line1 || '',
      city: user?.profile?.city || '',
      state: user?.profile?.state || '',
      zipCode: user?.profile?.postal_code || '',
      country: user?.profile?.country || '',
    })
    setEditing(true)
  }

  const displayData = editing ? formData : {
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.profile?.address_line1 || '',
    city: user?.profile?.city || '',
    state: user?.profile?.state || '',
    zipCode: user?.profile?.postal_code || '',
    country: user?.profile?.country || '',
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    try {
      const apiData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        profile: {
          address_line1: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode,
          country: formData.country,
        }
      }

      const res = await updateProfile(apiData)
      if (res.success) {
        setEditing(false)
        toast({ title: 'Success', description: 'Profile updated successfully!', variant: 'default' })
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to update profile', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
    }
  }

  if (isLoading || !isAuthorized || !roleConfirmed) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <Skeleton className="h-9 w-48 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-md" />
          <div className="md:col-span-2">
            <Skeleton className="h-96 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10 animate-fade-in">
      <div className="mb-8 pb-4 border-b border-border">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Account</span>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mt-1">My Profile</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <div className="border border-border rounded-md bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-md border border-border bg-muted flex items-center justify-center mb-4">
                <User className="w-9 h-9 text-muted-foreground" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Member since {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-md bg-card">
            <div className="p-6 pb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <h3 className="font-display font-semibold text-sm text-foreground">Account Security</h3>
            </div>
            <div className="p-6 pt-0 space-y-2">
              <Button variant="outline" className="w-full justify-start btn-press">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start btn-press">
                Two-Factor Auth
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive btn-press">
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2">
          <div className="border border-border rounded-md bg-card p-6">
            <div className="mb-6">
              <h3 className="font-display font-semibold text-lg text-foreground">Personal Information</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update your personal details and contact information
              </p>
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={displayData.firstName}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={!editing}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      value={displayData.lastName}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed here. Use account settings.
                </p>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={displayData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={!editing}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="border-t border-border pt-6">
                <h3 className="font-display font-semibold text-base text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Shipping Address
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={displayData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={displayData.city}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Region</Label>
                      <Input
                        id="state"
                        name="state"
                        value={displayData.state}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">Postal Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={displayData.zipCode}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={displayData.country}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {editing ? (
                  <>
                    <Button type="button" className="btn-press" onClick={handleSubmit}>Save Changes</Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="btn-press"
                      onClick={() => {
                        setEditing(false)
                        setFormData(EMPTY_FORM)
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button type="button" className="btn-press" onClick={handleEditClick}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
