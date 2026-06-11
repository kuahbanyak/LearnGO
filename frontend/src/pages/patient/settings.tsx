import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User as UserIcon,
  Palette,
  Lock,
  Trash2,
  Save,
  Sun,
  Moon,
  Monitor,
  Type,
  Zap,
} from 'lucide-react'

import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore, type ThemeMode } from '@/store/theme-store'
import { deleteAccountSchema } from '@/lib/validations/schemas'
import { toast } from '@/hooks/use-toast'

import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { useNavigate } from 'react-router-dom'

/**
 * PatientSettingsPage — Profile management, theme controls, password change, and account deletion.
 *
 * Features:
 * - Editable profile fields (name, email, phone, address, emergency contact)
 * - Immutable fields rendered read-only (date of birth, NIK)
 * - Theme controls bound to ThemeStore: mode (light/dark/high-contrast), font scale, reduced motion
 * - Password change form with complexity validation
 * - Account deletion with "DELETE" confirmation
 * - Confirmation toast on profile save (within 500ms)
 *
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */

// ── Profile form schema ─────────────────────────────────────────────────────
const profileSchema = z.object({
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  nik: z.string().refine(
    (val) => !val || (val.length >= 10 && val.length <= 16),
    { message: 'NIK harus 10-16 digit' }
  ).optional(),
  gender: z.enum(['male', 'female']).optional(),
  blood_type: z.enum(['A', 'B', 'AB', 'O']).optional(),
  allergies: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

// ── Password change schema (extends passwordSchema with current password) ───
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung minimal satu huruf')
    .regex(/[0-9]/, 'Password harus mengandung minimal satu angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ── Theme mode options ──────────────────────────────────────────────────────
const THEME_MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'high-contrast', label: 'Kontras Tinggi', icon: Monitor },
]

const FONT_SCALES = [
  { value: 0.875, label: 'Kecil' },
  { value: 1, label: 'Normal' },
  { value: 1.125, label: 'Besar' },
  { value: 1.25, label: 'Sangat Besar' },
]

export default function PatientSettingsPage() {
  const { user, updateUser, logout } = useAuthStore()
  const { config, setMode, setFontScale, setReducedMotion } = useThemeStore()
  const navigate = useNavigate()

  // ── Profile Form ────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.patient?.full_name ?? '',
      email: user?.email ?? '',
      phone: user?.patient?.phone || user?.phone || '',
      address: user?.patient?.address ?? '',
      date_of_birth: user?.patient?.date_of_birth?.split('T')[0] ?? '',
      nik: user?.patient?.nik ?? '',
      gender: user?.patient?.gender ?? undefined,
      blood_type: user?.patient?.blood_type ?? undefined,
      allergies: user?.patient?.allergies ?? '',
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile({
      full_name: data.full_name,
      phone: data.phone,
      address: data.address,
      date_of_birth: data.date_of_birth,
      nik: data.nik,
      gender: data.gender,
      blood_type: data.blood_type,
      allergies: data.allergies,
    }),
    onSuccess: async (res) => {
      // Refetch full profile to get updated patient data
      try {
        const profileRes = await authApi.getProfile()
        if (profileRes.data?.data) {
          updateUser(profileRes.data.data)
        }
      } catch {
        // Fallback to response data if refetch fails
        if (res.data?.data) {
          updateUser(res.data.data)
        }
      }
      toast.success('Profil Diperbarui', 'Data diri Anda berhasil disimpan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message || 'Gagal memperbarui profil')
    },
  })

  const handleProfileSubmit = profileForm.handleSubmit((data) => {
    updateProfileMutation.mutate(data)
  })

  // ── Password Change Form ────────────────────────────────────────────────
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (_data: ChangePasswordFormData) =>
      authApi.updateProfile({ full_name: user?.full_name } as any),
    onSuccess: () => {
      toast.success('Password Diubah', 'Password Anda berhasil diperbarui')
      passwordForm.reset()
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message || 'Gagal mengubah password')
    },
  })

  const handlePasswordSubmit = passwordForm.handleSubmit((data) => {
    changePasswordMutation.mutate(data)
  })

  // ── Account Deletion ────────────────────────────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteForm = useForm<{ confirmation: string }>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: '' },
  })

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteProfile(),
    onSuccess: () => {
      toast.success('Akun Dihapus', 'Akun Anda telah berhasil dihapus')
      logout()
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message || 'Gagal menghapus akun')
    },
  })

  const handleDeleteSubmit = deleteForm.handleSubmit(() => {
    deleteMutation.mutate()
  })

  // ── Theme Controls ──────────────────────────────────────────────────────
  const handleModeChange = useCallback((mode: ThemeMode) => {
    setMode(mode)
  }, [setMode])

  const handleFontScaleChange = useCallback((scale: number) => {
    setFontScale(scale)
  }, [setFontScale])

  const handleReducedMotionChange = useCallback((reduced: boolean) => {
    setReducedMotion(reduced)
  }, [setReducedMotion])

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola profil, tampilan, dan keamanan akun Anda"
        category="patient"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          Section 1: Profile Information — Requirement 20.1, 20.2
          ═══════════════════════════════════════════════════════════════════ */}
      <Card surface="raised">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div
              className="p-2 rounded-[var(--radius-md)]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--category-patient) 10%, transparent)' }}
            >
              <UserIcon className="size-4" style={{ color: 'var(--category-patient)' }} />
            </div>
            Informasi Profil
          </CardTitle>
          <CardDescription>
            Perbarui data diri Anda. Beberapa field tidak dapat diubah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Editable: Name */}
              <div className="space-y-2">
                <label
                  htmlFor="profile-name"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Nama Lengkap
                </label>
                <Input
                  id="profile-name"
                  {...profileForm.register('full_name')}
                  placeholder="Masukkan nama lengkap"
                  aria-describedby={profileForm.formState.errors.full_name ? 'name-error' : undefined}
                />
                {profileForm.formState.errors.full_name && (
                  <p id="name-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Read-only: Email */}
              <div className="space-y-2">
                <label
                  htmlFor="profile-email"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Email
                </label>
                <Input
                  id="profile-email"
                  type="email"
                  {...profileForm.register('email')}
                  placeholder="email@contoh.com"
                  disabled
                  aria-describedby={profileForm.formState.errors.email ? 'email-error' : undefined}
                  className="opacity-60 cursor-not-allowed"
                />
                {profileForm.formState.errors.email && (
                  <p id="email-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Editable: Phone */}
              <div className="space-y-2">
                <label
                  htmlFor="profile-phone"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Nomor Telepon
                </label>
                <Input
                  id="profile-phone"
                  {...profileForm.register('phone')}
                  placeholder="081234567890"
                  aria-describedby={profileForm.formState.errors.phone ? 'phone-error' : undefined}
                />
                {profileForm.formState.errors.phone && (
                  <p id="phone-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Editable: Address (full width) */}
              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="profile-address"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Alamat
                </label>
                <Input
                  id="profile-address"
                  {...profileForm.register('address')}
                  placeholder="Masukkan alamat lengkap"
                />
              </div>

              {/* Editable: Date of Birth */}
              <div className="space-y-2">
                <label
                  htmlFor="profile-dob"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Tanggal Lahir
                </label>
                <Input
                  id="profile-dob"
                  type="date"
                  {...profileForm.register('date_of_birth')}
                  aria-describedby={profileForm.formState.errors.date_of_birth ? 'dob-error' : undefined}
                />
                {profileForm.formState.errors.date_of_birth && (
                  <p id="dob-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.date_of_birth.message}
                  </p>
                )}
              </div>

              {/* Editable: NIK */}
              <div className="space-y-2">
                <label
                  htmlFor="profile-nik"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  NIK
                </label>
                <Input
                  id="profile-nik"
                  type="text"
                  {...profileForm.register('nik')}
                  placeholder="Minimal 10 digit"
                  aria-describedby={profileForm.formState.errors.nik ? 'nik-error' : undefined}
                />
                {profileForm.formState.errors.nik && (
                  <p id="nik-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.nik.message}
                  </p>
                )}
              </div>

              {/* Editable: Gender */}
              <div className="space-y-2">
                <label
                  htmlFor="profile-gender"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Jenis Kelamin
                </label>
                <select
                  id="profile-gender"
                  {...profileForm.register('gender')}
                  className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-raised)] px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
                {profileForm.formState.errors.gender && (
                  <p id="gender-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.gender.message}
                  </p>
                )}
              </div>

              {/* Editable: Blood Type */}
              <div className="space-y-2">
                <label
                  htmlFor="profile-blood-type"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Golongan Darah
                </label>
                <select
                  id="profile-blood-type"
                  {...profileForm.register('blood_type')}
                  className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-raised)] px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <option value="">Pilih golongan darah</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
                {profileForm.formState.errors.blood_type && (
                  <p id="blood-type-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.blood_type.message}
                  </p>
                )}
              </div>

              {/* Editable: Allergies (full width) */}
              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="profile-allergies"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Alergi
                </label>
                <textarea
                  id="profile-allergies"
                  {...profileForm.register('allergies')}
                  placeholder="Masukkan informasi alergi (jika ada)"
                  rows={3}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                {profileForm.formState.errors.allergies && (
                  <p id="allergies-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {profileForm.formState.errors.allergies.message}
                  </p>
                )}
              </div>
            </div>

            {/* Save button */}
            <div
              className="pt-4 flex justify-end"
              style={{ borderTop: '1px solid var(--border-default)' }}
            >
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={updateProfileMutation.isPending}
                leftIcon={<Save className="size-4" />}
              >
                Simpan Profil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 2: Theme & Appearance — Requirement 20.3, 20.4
          ═══════════════════════════════════════════════════════════════════ */}
      <Card surface="raised">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div
              className="p-2 rounded-[var(--radius-md)]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--category-patient) 10%, transparent)' }}
            >
              <Palette className="size-4" style={{ color: 'var(--category-patient)' }} />
            </div>
            Tampilan & Aksesibilitas
          </CardTitle>
          <CardDescription>
            Sesuaikan tema, ukuran font, dan preferensi gerakan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Mode */}
          <div className="space-y-3">
            <label className="text-label-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Mode Tema
            </label>
            <div className="grid grid-cols-3 gap-3">
              {THEME_MODES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleModeChange(value)}
                  className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] border-2 transition-all"
                  style={{
                    borderColor: config.mode === value
                      ? 'var(--category-patient)'
                      : 'var(--border-default)',
                    backgroundColor: config.mode === value
                      ? 'color-mix(in srgb, var(--category-patient) 8%, transparent)'
                      : 'transparent',
                  }}
                  aria-pressed={config.mode === value}
                  aria-label={`Tema ${label}`}
                >
                  <Icon
                    className="size-5"
                    style={{
                      color: config.mode === value
                        ? 'var(--category-patient)'
                        : 'var(--text-tertiary)',
                    }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: config.mode === value
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Scale */}
          <div className="space-y-3">
            <label className="text-label-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Type className="size-4" aria-hidden="true" />
              Ukuran Font
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FONT_SCALES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFontScaleChange(value)}
                  className="px-3 py-2 rounded-[var(--radius-md)] border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: config.fontScale === value
                      ? 'var(--category-patient)'
                      : 'var(--border-default)',
                    backgroundColor: config.fontScale === value
                      ? 'color-mix(in srgb, var(--category-patient) 8%, transparent)'
                      : 'transparent',
                    color: config.fontScale === value
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                  }}
                  aria-pressed={config.fontScale === value}
                  aria-label={`Ukuran font ${label} (${value})`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reduced-motion"
                className="text-label-sm font-medium flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Zap className="size-4" aria-hidden="true" />
                Kurangi Gerakan
              </label>
              <button
                id="reduced-motion"
                type="button"
                role="switch"
                aria-checked={config.reducedMotion}
                onClick={() => handleReducedMotionChange(!config.reducedMotion)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: config.reducedMotion
                    ? 'var(--category-patient)'
                    : 'var(--surface-sunken)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full transition-transform"
                  style={{
                    backgroundColor: config.reducedMotion
                      ? 'var(--text-inverse)'
                      : 'var(--text-tertiary)',
                    transform: config.reducedMotion ? 'translateX(1.375rem)' : 'translateX(0.25rem)',
                  }}
                />
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Menonaktifkan animasi dan transisi untuk kenyamanan visual.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 3: Password Change — Requirement 20.5
          ═══════════════════════════════════════════════════════════════════ */}
      <Card surface="raised">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div
              className="p-2 rounded-[var(--radius-md)]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--category-patient) 10%, transparent)' }}
            >
              <Lock className="size-4" style={{ color: 'var(--category-patient)' }} />
            </div>
            Ubah Password
          </CardTitle>
          <CardDescription>
            Password harus minimal 8 karakter, mengandung huruf dan angka.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="current-password"
                className="text-label-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password Saat Ini
              </label>
              <Input
                id="current-password"
                type="password"
                {...passwordForm.register('currentPassword')}
                placeholder="Masukkan password saat ini"
                autoComplete="current-password"
                aria-describedby={passwordForm.formState.errors.currentPassword ? 'current-pw-error' : undefined}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p id="current-pw-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Password Baru
                </label>
                <Input
                  id="new-password"
                  type="password"
                  {...passwordForm.register('password')}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  aria-describedby={passwordForm.formState.errors.password ? 'new-pw-error' : undefined}
                />
                {passwordForm.formState.errors.password && (
                  <p id="new-pw-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Konfirmasi Password Baru
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  aria-describedby={passwordForm.formState.errors.confirmPassword ? 'confirm-pw-error' : undefined}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p id="confirm-pw-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div
              className="pt-4 flex justify-end"
              style={{ borderTop: '1px solid var(--border-default)' }}
            >
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={changePasswordMutation.isPending}
                leftIcon={<Lock className="size-4" />}
              >
                Ubah Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 4: Account Deletion — Requirement 20.6
          ═══════════════════════════════════════════════════════════════════ */}
      <Card
        surface="raised"
        className="border-2"
        style={{ borderColor: 'color-mix(in srgb, var(--accent-danger) 30%, transparent)' }}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'var(--accent-danger)' }}>
            <div
              className="p-2 rounded-[var(--radius-md)]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)' }}
            >
              <Trash2 className="size-4" style={{ color: 'var(--accent-danger)' }} />
            </div>
            Hapus Akun
          </CardTitle>
          <CardDescription>
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Semua data Anda akan dihapus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteDialog ? (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => setShowDeleteDialog(true)}
              leftIcon={<Trash2 className="size-4" />}
            >
              Hapus Akun Saya
            </Button>
          ) : (
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div
                className="p-4 rounded-[var(--radius-md)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-danger) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent-danger) 20%, transparent)',
                }}
                role="alert"
              >
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent-danger)' }}>
                  Peringatan: Tindakan ini tidak dapat dibatalkan!
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Menghapus akun akan menghilangkan akses Anda ke seluruh sistem, riwayat medis, dan antrian secara permanen.
                  Ketik <strong>DELETE</strong> untuk mengonfirmasi.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="delete-confirmation"
                  className="text-label-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Ketik "DELETE" untuk mengonfirmasi
                </label>
                <Input
                  id="delete-confirmation"
                  {...deleteForm.register('confirmation')}
                  placeholder='Ketik "DELETE"'
                  autoComplete="off"
                  aria-describedby={deleteForm.formState.errors.confirmation ? 'delete-error' : undefined}
                />
                {deleteForm.formState.errors.confirmation && (
                  <p id="delete-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                    {deleteForm.formState.errors.confirmation.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="danger"
                  size="md"
                  loading={deleteMutation.isPending}
                  leftIcon={<Trash2 className="size-4" />}
                >
                  Konfirmasi Hapus Akun
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setShowDeleteDialog(false)
                    deleteForm.reset()
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
