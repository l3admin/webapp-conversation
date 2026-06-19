'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Building2, KeyRound, Link2, LogOut, MessageSquare, PlusCircle, RefreshCw, Save, UserCog, UserPlus, UserRoundCheck, UserRoundX, X } from 'lucide-react'
import Toast from '@/app/components/base/toast'
import {
  assignUserCustomerAccess,
  createAdminAgent,
  createAdminCustomer,
  fetchAdminAgentAccess,
  fetchAdminAgents,
  fetchAdminCustomers,
  fetchAdminOverview,
  fetchAdminUsers,
  inviteAdminUser,
  resetAdminUserPassword,
  setAdminUserDisabled,
  syncAdminAgentsFromEnv,
  setCustomerAgents,
  updateAdminUserProfile,
} from '@/service'
import type { AdminAgentAccessRow, AdminAgentCatalogItem, AdminCustomerItem, AdminOverview, AdminUserItem } from '@/types/app'

const emptyOverview: AdminOverview = {
  total_users: 0,
  total_customers: 0,
  total_agent_catalog: 0,
  total_customer_agent_assignments: 0,
  total_user_customer_assignments: 0,
}

const normalizeText = (value: string) => {
  const trimmed = value.trim()
  return trimmed || null
}

const getTemporaryPasswordValidationError = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Password is required.'
  }
  if (trimmed.length < 6) {
    return 'Password must be at least 6 characters.'
  }
  const hasLetter = /[a-zA-Z]/.test(trimmed)
  const hasNumber = /\d/.test(trimmed)
  if (!hasLetter || !hasNumber) {
    return 'Password must contain at least one letter and one number.'
  }
  return null
}

const getErrorMessage = async (error: any, fallback: string) => {
  if (!error) {
    return fallback
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }
  if (typeof error?.json === 'function') {
    try {
      const payload = await error.json()
      if (typeof payload?.received === 'string' && payload.received.trim()) {
        return payload.received
      }
      if (typeof payload?.error === 'string' && payload.error.trim()) {
        return payload.error
      }
      if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message
      }
    }
    catch {
      return fallback
    }
  }
  return fallback
}

type AdminTab = 'users' | 'customers' | 'agents' | 'assignments' | 'access-viewer'
type AgentDraft = {
  display_name: string
  button_label: string
  description: string
  is_active: boolean
}

const AdminConsole = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview)
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [customers, setCustomers] = useState<AdminCustomerItem[]>([])
  const [agents, setAgents] = useState<AdminAgentCatalogItem[]>([])
  const [agentAccessRows, setAgentAccessRows] = useState<AdminAgentAccessRow[]>([])

  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserFirstName, setNewUserFirstName] = useState('')
  const [newUserLastName, setNewUserLastName] = useState('')
  const [newUserDisplayName, setNewUserDisplayName] = useState('')
  const [sendInviteEmail, setSendInviteEmail] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [managedUserId, setManagedUserId] = useState('')
  const [managedUserEmail, setManagedUserEmail] = useState('')
  const [managedUserFirstName, setManagedUserFirstName] = useState('')
  const [managedUserLastName, setManagedUserLastName] = useState('')
  const [managedUserDisplayName, setManagedUserDisplayName] = useState('')
  const [managedUserIsDisabled, setManagedUserIsDisabled] = useState(false)
  const [managedUserIsMasterAdmin, setManagedUserIsMasterAdmin] = useState(false)
  const [managedResetPassword, setManagedResetPassword] = useState('')

  const [newCustomerSlug, setNewCustomerSlug] = useState('')
  const [newCustomerDisplayName, setNewCustomerDisplayName] = useState('')
  const [newCustomerStatus, setNewCustomerStatus] = useState('active')

  const [newAgentId, setNewAgentId] = useState('')
  const [newAgentDisplayName, setNewAgentDisplayName] = useState('')
  const [newAgentButtonLabel, setNewAgentButtonLabel] = useState('')
  const [newAgentDescription, setNewAgentDescription] = useState('')
  const [agentDrafts, setAgentDrafts] = useState<Record<string, AgentDraft>>({})

  const [assignmentUserId, setAssignmentUserId] = useState('')
  const [assignmentCustomerId, setAssignmentCustomerId] = useState('')
  const [assignmentRole, setAssignmentRole] = useState<'admin' | 'member'>('member')

  const [selectedCustomerForAgents, setSelectedCustomerForAgents] = useState('')
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [selectedDefaultAgentId, setSelectedDefaultAgentId] = useState('')
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [isEnvHelpOpen, setIsEnvHelpOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const supabaseClient = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    if (!url || !key) {
      return null
    }
    return createBrowserClient(url, key)
  }, [])

  const loadAll = async () => {
    const [overviewRes, usersRes, customersRes, agentsRes] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminUsers(),
      fetchAdminCustomers(),
      fetchAdminAgents(),
    ])
    const agentAccessRes = await fetchAdminAgentAccess()
    setOverview(overviewRes.data)
    setUsers(usersRes.data)
    setCustomers(customersRes.data)
    setAgents(agentsRes.data)
    setAgentAccessRows(agentAccessRes.data)
  }

  useEffect(() => {
    (async () => {
      try {
        await loadAll()
      }
      catch (error: any) {
        const message = await getErrorMessage(error, 'Failed to load admin data.')
        Toast.notify({ type: 'error', message })
      }
      finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const next: Record<string, AgentDraft> = {}
    agents.forEach((agent) => {
      next[agent.agent_id] = {
        display_name: agent.display_name,
        button_label: agent.button_label || '',
        description: agent.description || '',
        is_active: agent.is_active,
      }
    })
    setAgentDrafts(next)
  }, [agents])

  const customerOptions = useMemo(() => {
    return customers.map(customer => ({
      id: customer.id,
      label: `${customer.display_name} (${customer.slug})`,
    }))
  }, [customers])

  const customersById = useMemo(() => {
    return new Map(customers.map(customer => [customer.id, customer]))
  }, [customers])

  const allUserOrganisationAssignments = useMemo(() => {
    return users.flatMap((user) => {
      if (!user.customer_ids.length) {
        return []
      }
      return user.customer_ids.map((customerId) => {
        const customer = customersById.get(customerId)
        return {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          display_name: user.display_name,
          is_disabled: user.is_disabled,
          customer_id: customerId,
          customer_display_name: customer?.display_name || 'Unknown organisation',
          customer_slug: customer?.slug || null,
        }
      })
    })
  }, [users, customersById])

  const visibleUserOrganisationAssignments = useMemo(() => {
    if (!assignmentCustomerId) {
      return allUserOrganisationAssignments
    }
    return allUserOrganisationAssignments.filter(row => row.customer_id === assignmentCustomerId)
  }, [allUserOrganisationAssignments, assignmentCustomerId])

  const organisationAgentAssignments = useMemo(() => {
    const map = new Map<string, { assigned_agents: string[], default_agent_id: string | null }>()
    agentAccessRows.forEach((row) => {
      if (!row.customer_id) {
        return
      }
      const existing = map.get(row.customer_id)
      if (!existing) {
        map.set(row.customer_id, {
          assigned_agents: [...row.assigned_agents],
          default_agent_id: row.default_agent_id,
        })
        return
      }

      const nextAssignedAgents = Array.from(new Set([...existing.assigned_agents, ...row.assigned_agents]))
      map.set(row.customer_id, {
        assigned_agents: nextAssignedAgents,
        default_agent_id: existing.default_agent_id || row.default_agent_id || null,
      })
    })
    return map
  }, [agentAccessRows])

  const allOrganisationAgentAssignments = useMemo(() => {
    const rows: Array<{
      customer_id: string
      customer_display_name: string
      customer_slug: string | null
      agent_id: string
      display_name: string
      is_default: boolean
    }> = []
    organisationAgentAssignments.forEach((assignment, customerId) => {
      const customer = customersById.get(customerId)
      assignment.assigned_agents.forEach((agentId) => {
        const catalogAgent = agents.find(agent => agent.agent_id === agentId)
        rows.push({
          customer_id: customerId,
          customer_display_name: customer?.display_name || 'Unknown organisation',
          customer_slug: customer?.slug || null,
          agent_id: agentId,
          display_name: catalogAgent?.display_name || agentId,
          is_default: assignment.default_agent_id === agentId,
        })
      })
    })
    return rows
  }, [organisationAgentAssignments, customersById, agents])

  const visibleOrganisationAgentAssignments = useMemo(() => {
    if (!selectedCustomerForAgents) {
      return allOrganisationAgentAssignments
    }
    return allOrganisationAgentAssignments.filter(row => row.customer_id === selectedCustomerForAgents)
  }, [allOrganisationAgentAssignments, selectedCustomerForAgents])

  useEffect(() => {
    if (!selectedCustomerForAgents) {
      setSelectedAgentIds([])
      setSelectedDefaultAgentId('')
      return
    }
    const assignment = organisationAgentAssignments.get(selectedCustomerForAgents)
    if (!assignment) {
      setSelectedAgentIds([])
      setSelectedDefaultAgentId('')
      return
    }
    setSelectedAgentIds(assignment.assigned_agents)
    setSelectedDefaultAgentId(assignment.default_agent_id || assignment.assigned_agents[0] || '')
  }, [selectedCustomerForAgents, organisationAgentAssignments])

  const handleInviteUser = async () => {
    if (isSaving)
      return
    if (!newUserEmail.trim()) {
      Toast.notify({ type: 'error', message: 'Email is required.' })
      return
    }
    if (!newUserPassword.trim()) {
      Toast.notify({ type: 'error', message: 'Password is required.' })
      return
    }
    if (!newUserFirstName.trim()) {
      Toast.notify({ type: 'error', message: 'First name is required.' })
      return
    }
    if (!newUserLastName.trim()) {
      Toast.notify({ type: 'error', message: 'Last name is required.' })
      return
    }
    setIsSaving(true)
    try {
      await inviteAdminUser({
        email: newUserEmail.trim(),
        password: newUserPassword,
        first_name: newUserFirstName.trim(),
        last_name: newUserLastName.trim(),
        display_name: normalizeText(newUserDisplayName),
        send_invite_email: sendInviteEmail,
      })
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserFirstName('')
      setNewUserLastName('')
      setNewUserDisplayName('')
      await loadAll()
      Toast.notify({ type: 'success', message: sendInviteEmail ? 'Invitation sent and user profile created.' : 'User created without sending invite email.' })
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to invite user.' })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (isSaving)
      return
    if (!newCustomerSlug.trim() || !newCustomerDisplayName.trim()) {
      Toast.notify({ type: 'error', message: 'Organisation slug and display name are required.' })
      return
    }
    setIsSaving(true)
    try {
      await createAdminCustomer({
        slug: newCustomerSlug.trim(),
        display_name: newCustomerDisplayName.trim(),
        status: newCustomerStatus.trim() || 'active',
      })
      setNewCustomerSlug('')
      setNewCustomerDisplayName('')
      setNewCustomerStatus('active')
      await loadAll()
      Toast.notify({ type: 'success', message: 'Organisation created.' })
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to create organisation.' })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleCreateAgent = async () => {
    if (isSaving)
      return
    if (!newAgentId.trim() || !newAgentDisplayName.trim()) {
      Toast.notify({ type: 'error', message: 'Agent ID and display name are required.' })
      return
    }
    setIsSaving(true)
    try {
      await createAdminAgent({
        agent_id: newAgentId.trim(),
        display_name: newAgentDisplayName.trim(),
        button_label: normalizeText(newAgentButtonLabel),
        description: normalizeText(newAgentDescription),
        is_active: true,
      })
      setNewAgentId('')
      setNewAgentDisplayName('')
      setNewAgentButtonLabel('')
      setNewAgentDescription('')
      await loadAll()
      Toast.notify({ type: 'success', message: 'Agent saved to catalogue.' })
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to create agent.' })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleAgentDraftChange = (agentId: string, patch: Partial<AgentDraft>) => {
    setAgentDrafts((current) => {
      const previous = current[agentId] || {
        display_name: '',
        button_label: '',
        description: '',
        is_active: true,
      }
      return {
        ...current,
        [agentId]: {
          ...previous,
          ...patch,
        },
      }
    })
  }

  const handleSaveExistingAgent = async (agentId: string) => {
    if (isSaving) {
      return
    }
    const draft = agentDrafts[agentId]
    if (!draft || !draft.display_name.trim()) {
      Toast.notify({ type: 'error', message: `Display name is required for ${agentId}.` })
      return
    }

    setIsSaving(true)
    try {
      await createAdminAgent({
        agent_id: agentId,
        display_name: draft.display_name.trim(),
        button_label: normalizeText(draft.button_label),
        description: normalizeText(draft.description),
        is_active: draft.is_active,
      })
      await loadAll()
      Toast.notify({ type: 'success', message: `Agent ${agentId} updated.` })
    }
    catch (error: any) {
      const message = await getErrorMessage(error, `Failed to update agent ${agentId}.`)
      Toast.notify({ type: 'error', message })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleSyncAgentsFromEnv = async () => {
    if (isSaving) {
      return
    }
    setIsSaving(true)
    try {
      const response = await syncAdminAgentsFromEnv()
      await loadAll()
      const insertedCount = response.data.inserted_agent_ids.length
      const existingCount = response.data.existing_agent_ids.length
      Toast.notify({ type: 'success', message: `Env sync complete. Inserted ${insertedCount}, already present ${existingCount}.` })
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to sync agents from env.' })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleAssignUserToCustomer = async () => {
    if (isSaving)
      return
    if (!assignmentUserId || !assignmentCustomerId) {
      Toast.notify({ type: 'error', message: 'Select a user and organisation first.' })
      return
    }
    setIsSaving(true)
    try {
      await assignUserCustomerAccess({
        user_id: assignmentUserId,
        customer_id: assignmentCustomerId,
        role: assignmentRole,
      })
      setAssignmentRole('member')
      await loadAll()
      Toast.notify({ type: 'success', message: 'User assignment saved.' })
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to assign user.' })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleSetUserDisabled = async (userId: string, isDisabled: boolean) => {
    if (isSaving) {
      return
    }
    const actionLabel = isDisabled ? 'disable' : 'enable'
    const confirmed = globalThis.confirm(`Are you sure you want to ${actionLabel} this user?`)
    if (!confirmed) {
      return false
    }
    setIsSaving(true)
    try {
      await setAdminUserDisabled(userId, isDisabled)
      await loadAll()
      Toast.notify({ type: 'success', message: isDisabled ? 'User disabled and access removed.' : 'User enabled.' })
      return true
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to update user state.' })
      return false
    }
    finally {
      setIsSaving(false)
    }
  }

  const openUserModal = (user: AdminUserItem) => {
    setManagedUserId(user.user_id)
    setManagedUserEmail(user.email)
    setManagedUserFirstName(user.first_name || '')
    setManagedUserLastName(user.last_name || '')
    setManagedUserDisplayName(user.display_name || '')
    setManagedUserIsDisabled(user.is_disabled)
    setManagedUserIsMasterAdmin(user.is_master_admin)
    setManagedResetPassword('')
    setIsUserModalOpen(true)
  }

  const closeUserModal = () => {
    if (isSaving) {
      return
    }
    setIsUserModalOpen(false)
  }

  const handleSaveManagedUser = async () => {
    if (isSaving) {
      return
    }
    if (!managedUserId) {
      return
    }
    if (!managedUserFirstName.trim() || !managedUserLastName.trim()) {
      Toast.notify({ type: 'error', message: 'First name and last name are required.' })
      return
    }
    setIsSaving(true)
    try {
      await updateAdminUserProfile(managedUserId, {
        first_name: managedUserFirstName.trim(),
        last_name: managedUserLastName.trim(),
        display_name: normalizeText(managedUserDisplayName),
      })
      await loadAll()
      Toast.notify({ type: 'success', message: 'User profile updated.' })
    }
    catch (error: any) {
      const message = await getErrorMessage(error, 'Failed to update user profile.')
      Toast.notify({ type: 'error', message })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleResetManagedUserPassword = async () => {
    if (isSaving) {
      return
    }
    if (!managedUserId) {
      return
    }
    const passwordValidationError = getTemporaryPasswordValidationError(managedResetPassword)
    if (passwordValidationError) {
      Toast.notify({ type: 'error', message: passwordValidationError })
      return
    }
    setIsSaving(true)
    try {
      await resetAdminUserPassword(managedUserId, { password: managedResetPassword })
      setManagedResetPassword('')
      await loadAll()
      Toast.notify({ type: 'success', message: 'Password reset. User must change password on next login.' })
    }
    catch (error: any) {
      const message = await getErrorMessage(error, 'Failed to reset password.')
      Toast.notify({ type: 'error', message })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleToggleManagedUserDisabled = async () => {
    if (!managedUserId) {
      return
    }
    const nextDisabledState = !managedUserIsDisabled
    const success = await handleSetUserDisabled(managedUserId, nextDisabledState)
    if (success) {
      setManagedUserIsDisabled(nextDisabledState)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }
    if (!supabaseClient) {
      Toast.notify({ type: 'error', message: 'Missing Supabase client configuration for sign out.' })
      return
    }

    setIsSigningOut(true)
    try {
      const { error } = await supabaseClient.auth.signOut()
      if (error) {
        throw error
      }
      globalThis.location.assign('/sign-in')
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to sign out.' })
    }
    finally {
      setIsSigningOut(false)
    }
  }

  const toggleSelectedAgent = (agentId: string) => {
    setSelectedAgentIds((current) => {
      if (current.includes(agentId)) {
        const next = current.filter(id => id !== agentId)
        if (selectedDefaultAgentId === agentId) {
          setSelectedDefaultAgentId(next[0] || '')
        }
        return next
      }
      return [...current, agentId]
    })
  }

  const handleSetCustomerAgents = async () => {
    if (isSaving)
      return
    if (!selectedCustomerForAgents) {
      Toast.notify({ type: 'error', message: 'Select an organisation first.' })
      return
    }
    if (!selectedAgentIds.length) {
      Toast.notify({ type: 'error', message: 'Select at least one agent.' })
      return
    }
    if (!selectedDefaultAgentId || !selectedAgentIds.includes(selectedDefaultAgentId)) {
      Toast.notify({ type: 'error', message: 'Select a valid default agent from the selected list.' })
      return
    }
    setIsSaving(true)
    try {
      await setCustomerAgents({
        customer_id: selectedCustomerForAgents,
        agent_ids: selectedAgentIds,
        default_agent_id: selectedDefaultAgentId,
      })
      await loadAll()
      Toast.notify({ type: 'success', message: 'Organisation agent access updated.' })
    }
    catch (error: any) {
      Toast.notify({ type: 'error', message: error?.message || 'Failed to update organisation agents.' })
    }
    finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading admin console...</div>
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">Admin Console</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              onClick={() => globalThis.location.assign('/?view=chat')}
            >
              <MessageSquare className="h-4 w-4" />
              Open Chat
            </button>
            <button
              type="button"
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? 'Signing out...' : 'Log out'}
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">Invite-only workspace management for users, organisations, and agent access.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700 md:grid-cols-5">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2">Users: {overview.total_users}</div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2">Organisations: {overview.total_customers}</div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2">Catalogue Agents: {overview.total_agent_catalog}</div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2">User Assignments: {overview.total_user_customer_assignments}</div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2">Organisation Agent Links: {overview.total_customer_agent_assignments}</div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
          <div className="flex flex-wrap items-end gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`-mb-px rounded-t-md border px-3 py-2 text-sm font-semibold ${activeTab === 'users' ? 'border-gray-200 border-b-white bg-white text-indigo-700' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
            >
              Users
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`-mb-px rounded-t-md border px-3 py-2 text-sm font-semibold ${activeTab === 'customers' ? 'border-gray-200 border-b-white bg-white text-indigo-700' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
            >
              Organisations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agents')}
              className={`-mb-px rounded-t-md border px-3 py-2 text-sm font-semibold ${activeTab === 'agents' ? 'border-gray-200 border-b-white bg-white text-indigo-700' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
            >
              Agents
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`-mb-px rounded-t-md border px-3 py-2 text-sm font-semibold ${activeTab === 'assignments' ? 'border-gray-200 border-b-white bg-white text-indigo-700' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
            >
              Assignments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('access-viewer')}
              className={`-mb-px rounded-t-md border px-3 py-2 text-sm font-semibold ${activeTab === 'access-viewer' ? 'border-gray-200 border-b-white bg-white text-indigo-700' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
            >
              Access Viewer
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {activeTab === 'users' && (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">Create User</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-6">
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" type="password" placeholder="Password (min 8 chars)" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="First name" value={newUserFirstName} onChange={e => setNewUserFirstName(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Last name" value={newUserLastName} onChange={e => setNewUserLastName(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Display name (optional)" value={newUserDisplayName} onChange={e => setNewUserDisplayName(e.target.value)} />
              <button type="button" disabled={isSaving} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={handleInviteUser}>
                <UserPlus className="h-4 w-4" />
                {sendInviteEmail ? 'Create User + Invite Email' : 'Create User'}
              </button>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={sendInviteEmail}
                onChange={e => setSendInviteEmail(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Send Supabase invite email</span>
            </label>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">Users</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="py-2">Email</th>
                    <th className="py-2">First Name</th>
                    <th className="py-2">Last Name</th>
                    <th className="py-2">Display Name</th>
                    <th className="py-2">Master Admin</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Must Change Password</th>
                    <th className="py-2">Organisation IDs</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.user_id} className="border-b border-gray-100 text-gray-800">
                      <td className="py-2">{user.email}</td>
                      <td className="py-2">{user.first_name || '-'}</td>
                      <td className="py-2">{user.last_name || '-'}</td>
                      <td className="py-2">{user.display_name || '-'}</td>
                      <td className="py-2">{user.is_master_admin ? 'Yes' : 'No'}</td>
                      <td className="py-2">{user.is_disabled ? 'Disabled' : 'Active'}</td>
                      <td className="py-2">{user.must_change_password ? 'Yes' : 'No'}</td>
                      <td className="py-2">{user.customer_ids.join(', ') || '-'}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => openUserModal(user)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </section>
            </>
          )}

          {activeTab === 'customers' && (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">Create Organisation</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Slug (e.g. acme_org)" value={newCustomerSlug} onChange={e => setNewCustomerSlug(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Display name" value={newCustomerDisplayName} onChange={e => setNewCustomerDisplayName(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Status (default active)" value={newCustomerStatus} onChange={e => setNewCustomerStatus(e.target.value)} />
              <button type="button" disabled={isSaving} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={handleCreateCustomer}>
                <Building2 className="h-4 w-4" />
                Create Organisation
              </button>
            </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">Organisations</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="py-2">Display Name</th>
                    <th className="py-2">Slug</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.id} className="border-b border-gray-100 text-gray-800">
                      <td className="py-2">{customer.display_name}</td>
                      <td className="py-2">{customer.slug}</td>
                      <td className="py-2">{customer.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </section>
            </>
          )}

          {activeTab === 'agents' && (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">Agent Catalogue</h2>
              <button
                type="button"
                onClick={() => setIsEnvHelpOpen(true)}
                className="h-7 w-7 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50"
                aria-label="How agent sync from env works"
                title="How agent sync from env works"
              >
                ?
              </button>
            </div>
            <div className="mt-3">
              <button
                type="button"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                onClick={handleSyncAgentsFromEnv}
              >
                <RefreshCw className="h-4 w-4" />
                Sync Agents From Env
              </button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-5">
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Agent ID (matches env key suffix)" value={newAgentId} onChange={e => setNewAgentId(e.target.value.toUpperCase())} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Display name" value={newAgentDisplayName} onChange={e => setNewAgentDisplayName(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Selector button label (optional)" value={newAgentButtonLabel} onChange={e => setNewAgentButtonLabel(e.target.value)} />
              <input className="rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Description (optional)" value={newAgentDescription} onChange={e => setNewAgentDescription(e.target.value)} />
              <button type="button" disabled={isSaving} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={handleCreateAgent}>
                <PlusCircle className="h-4 w-4" />
                Add Agent
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="py-2">Agent ID</th>
                    <th className="py-2">Display Name</th>
                    <th className="py-2">Button Label</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Active</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(agent => (
                    <tr key={agent.agent_id} className="border-b border-gray-100 text-gray-800">
                      <td className="py-2">{agent.agent_id}</td>
                      <td className="py-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs"
                          value={agentDrafts[agent.agent_id]?.display_name ?? agent.display_name}
                          onChange={event => handleAgentDraftChange(agent.agent_id, { display_name: event.target.value })}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs"
                          value={agentDrafts[agent.agent_id]?.button_label ?? (agent.button_label || '')}
                          onChange={event => handleAgentDraftChange(agent.agent_id, { button_label: event.target.value })}
                          placeholder="Optional short button label"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs"
                          value={agentDrafts[agent.agent_id]?.description ?? (agent.description || '')}
                          onChange={event => handleAgentDraftChange(agent.agent_id, { description: event.target.value })}
                          placeholder="Optional description"
                        />
                      </td>
                      <td className="py-2">
                        <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={Boolean(agentDrafts[agent.agent_id]?.is_active ?? agent.is_active)}
                            onChange={event => handleAgentDraftChange(agent.agent_id, { is_active: event.target.checked })}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{(agentDrafts[agent.agent_id]?.is_active ?? agent.is_active) ? 'Yes' : 'No'}</span>
                        </label>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          onClick={() => handleSaveExistingAgent(agent.agent_id)}
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </section>
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">Assign User to Organisation</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <select className="rounded-md border border-gray-200 px-3 py-2 text-sm" value={assignmentUserId} onChange={e => setAssignmentUserId(e.target.value)}>
                <option value="">Select user</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>{user.email}</option>
                ))}
              </select>
              <select className="rounded-md border border-gray-200 px-3 py-2 text-sm" value={assignmentCustomerId} onChange={e => setAssignmentCustomerId(e.target.value)}>
                <option value="">All organisations</option>
                {customerOptions.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.label}</option>
                ))}
              </select>
              <select className="rounded-md border border-gray-200 px-3 py-2 text-sm" value={assignmentRole} onChange={e => setAssignmentRole(e.target.value as 'admin' | 'member')}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <button type="button" disabled={isSaving} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={handleAssignUserToCustomer}>
                <Link2 className="h-4 w-4" />
                Assign
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="py-2">Organisation</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">First Name</th>
                    <th className="py-2">Last Name</th>
                    <th className="py-2">Display Name</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUserOrganisationAssignments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-3 text-gray-500">
                        {assignmentCustomerId
                          ? 'No users are assigned to this organisation yet.'
                          : 'No user-to-organisation assignments found yet.'}
                      </td>
                    </tr>
                  )}
                  {visibleUserOrganisationAssignments.map(row => (
                    <tr key={`org-user-${row.user_id}-${row.customer_id}`} className="border-b border-gray-100 text-gray-800">
                      <td className="py-2">{row.customer_display_name} ({row.customer_slug || 'no-slug'})</td>
                      <td className="py-2">{row.email}</td>
                      <td className="py-2">{row.first_name || '-'}</td>
                      <td className="py-2">{row.last_name || '-'}</td>
                      <td className="py-2">{row.display_name || '-'}</td>
                      <td className="py-2">{row.is_disabled ? 'Disabled' : 'Active'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">Assign Agents to Organisation</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <select className="rounded-md border border-gray-200 px-3 py-2 text-sm" value={selectedCustomerForAgents} onChange={e => setSelectedCustomerForAgents(e.target.value)}>
                <option value="">All organisations</option>
                {customerOptions.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.label}</option>
                ))}
              </select>
              <select className="rounded-md border border-gray-200 px-3 py-2 text-sm" value={selectedDefaultAgentId} onChange={e => setSelectedDefaultAgentId(e.target.value)}>
                <option value="">Select default agent</option>
                {selectedAgentIds.map(agentId => (
                  <option key={agentId} value={agentId}>{agentId}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {agents.map(agent => (
                <button
                  key={agent.agent_id}
                  type="button"
                  onClick={() => toggleSelectedAgent(agent.agent_id)}
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${selectedAgentIds.includes(agent.agent_id) ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'}`}
                >
                  {agent.agent_id}
                </button>
              ))}
            </div>
            <button type="button" disabled={isSaving} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={handleSetCustomerAgents}>
              <Save className="h-4 w-4" />
              Save Organisation Agents
            </button>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="py-2">Organisation</th>
                    <th className="py-2">Agent ID</th>
                    <th className="py-2">Display Name</th>
                    <th className="py-2">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrganisationAgentAssignments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-gray-500">
                        {selectedCustomerForAgents
                          ? 'No agents are assigned to this organisation yet.'
                          : 'No organisation-to-agent assignments found yet.'}
                      </td>
                    </tr>
                  )}
                  {visibleOrganisationAgentAssignments.map(row => (
                    <tr key={`org-agent-${row.customer_id}-${row.agent_id}`} className="border-b border-gray-100 text-gray-800">
                      <td className="py-2">{row.customer_display_name} ({row.customer_slug || 'no-slug'})</td>
                      <td className="py-2">{row.agent_id}</td>
                      <td className="py-2">{row.display_name}</td>
                      <td className="py-2">{row.is_default ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </section>
            </>
          )}

          {activeTab === 'access-viewer' && (
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-semibold text-gray-900">Agent Access Viewer</h2>
              <p className="mt-1 text-xs text-gray-600">Effective access by user and organisation, including assigned agents and default agent.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="py-2">User Email</th>
                      <th className="py-2">User Status</th>
                      <th className="py-2">Organisation</th>
                      <th className="py-2">Assigned Agents</th>
                      <th className="py-2">Default Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentAccessRows.map((row, index) => (
                      <tr key={`${row.user_id}:${row.customer_id || 'none'}:${index}`} className="border-b border-gray-100 text-gray-800">
                        <td className="py-2">{row.email}</td>
                        <td className="py-2">{row.user_disabled ? 'Disabled' : 'Active'}</td>
                        <td className="py-2">
                          {row.customer_display_name
                            ? `${row.customer_display_name} (${row.customer_slug || 'no-slug'})`
                            : '-'}
                        </td>
                        <td className="py-2">{row.assigned_agents.length ? row.assigned_agents.join(', ') : '-'}</td>
                        <td className="py-2">{row.default_agent_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </section>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={closeUserModal}>
          <div className="flex h-full w-full items-center justify-center p-4" onClick={event => event.stopPropagation()}>
            <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-gray-900">Manage User</h3>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" onClick={closeUserModal}>
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                  <div><span className="font-semibold">User:</span> {managedUserEmail || '-'}</div>
                  <div><span className="font-semibold">Status:</span> {managedUserIsDisabled ? 'Disabled' : 'Active'}</div>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Profile</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="First name"
                      value={managedUserFirstName}
                      onChange={event => setManagedUserFirstName(event.target.value)}
                    />
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Last name"
                      value={managedUserLastName}
                      onChange={event => setManagedUserLastName(event.target.value)}
                    />
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Display name (optional)"
                      value={managedUserDisplayName}
                      onChange={event => setManagedUserDisplayName(event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    onClick={handleSaveManagedUser}
                  >
                    <Save className="h-4 w-4" />
                    Save Profile
                  </button>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Security</h4>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      type="password"
                      placeholder="New temporary password"
                      value={managedResetPassword}
                      onChange={event => setManagedResetPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      onClick={handleResetManagedUserPassword}
                    >
                      <KeyRound className="h-4 w-4" />
                      Reset Password
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">Temporary password must be at least 6 characters and include at least one letter and one number.</p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Account Status</h4>
                  <button
                    type="button"
                    disabled={isSaving || managedUserIsMasterAdmin}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold ${managedUserIsDisabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'} disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
                    onClick={handleToggleManagedUserDisabled}
                  >
                    {managedUserIsDisabled ? <UserRoundCheck className="h-4 w-4" /> : <UserRoundX className="h-4 w-4" />}
                    {managedUserIsDisabled ? 'Enable User' : 'Disable User'}
                  </button>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEnvHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setIsEnvHelpOpen(false)}>
          <div className="flex h-full w-full items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-gray-900">Sync Agents From Env: Instructions</h3>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" onClick={() => setIsEnvHelpOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>Add one server env variable per agent using this exact pattern:</p>
                <p className="rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">DIFY_APP_API_KEY_&lt;AGENT_ID&gt;=&lt;dify_api_key&gt;</p>
                <p>Examples:</p>
                <p className="rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">DIFY_APP_API_KEY_KN_COLD=app-xxxx</p>
                <p className="rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">DIFY_APP_API_KEY_KN_CUSTOMER=app-yyyy</p>
                <p>Rules:</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-gray-600">
                  <li>Use uppercase agent IDs with underscores only.</li>
                  <li>Set variables in local `.env.local` and in Cloud Run service env.</li>
                  <li>Restart the app after env changes, then click <strong>Sync Agents From Env</strong>.</li>
                  <li>Sync inserts missing agents into catalogue; existing display names are preserved.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminConsole
