import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { Project } from '../models/Project';
import { getProjectStatus, getDueAmount, isOverdue } from '../utils/status';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Layout } from '../components/Layout';
import { validateURL } from '../utils/validation';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, fetchProject, updateProject, loading: globalLoading, error } = useProjects();
  const toast = useToast();

  // Initialize project from cache if available to prevent flicker
  const [project, setProject] = useState<Project | null>(() =>
    projects.find(p => p.id === id) || null
  );

  // Local loading state to handle initial mount before fetch starts
  const [isInitializing, setIsInitializing] = useState(!project);

  // Payment UX State
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Status UX State
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Handover UX State
  const [editingLink, setEditingLink] = useState<'repo' | 'live' | 'video' | null>(null);
  const [tempLinkValue, setTempLinkValue] = useState('');

  useEffect(() => {
    if (id) {
      fetchProject(id)
        .then(setProject)
        .finally(() => setIsInitializing(false));
    }
  }, [id, fetchProject]);

  // Show loading only if we have no project data and are fetching/initializing
  if ((globalLoading || isInitializing) && !project) {
    return (
      <Layout>
        <div className="text-gray-500">Loading project...</div>
      </Layout>
    );
  }

  // Show error only if we aren't loading and still have no project
  if (error || (!project && !isInitializing && !globalLoading)) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-red-500 mb-4">Error: {error || 'Project not found'}</div>
          <Button onClick={() => navigate('/')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  const status = getProjectStatus(project);
  const dueAmount = getDueAmount(project);
  const overdue = isOverdue(project);

  const handleStatusUpdate = async (type: 'delivered') => {
    if (!project || !id) return;
    setStatusUpdating(true);
    try {
      const updates: Partial<Project> = {};
      const now = new Date().toISOString();

      if (type === 'delivered') {
        updates.deliveredAt = now;
      }

      // Update project and use returned updated project
      const updatedProject = await updateProject(id, updates);
      setProject(updatedProject);
      toast.success('Status updated', 'Project has been marked as delivered');
    } catch (err) {
      // Error is handled by toast in context
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      return; // Basic validation
    }

    if (!project || !id) return;

    try {
      const amountToAdd = Number(paymentAmount); // Decimals allowed
      const newTotalReceived = (project.totalReceived || 0) + amountToAdd;

      // Update project and use returned updated project
      const updatedProject = await updateProject(id, { totalReceived: newTotalReceived });
      setProject(updatedProject);

      // Reset local state
      setIsAddingPayment(false);
      setPaymentAmount('');
      setPaymentError(null);
      toast.success('Payment recorded', `Payment of ${formatINR(amountToAdd)} has been recorded`);

    } catch (err) {
      setPaymentError('Failed to save payment. Please try again.');
      // Error toast is handled by context
    }
  };

  const handleLinkUpdate = async (field: 'repoLink' | 'liveLink' | 'completionVideoLink') => {
    if (!project || !id) return;

    // Validation
    if (tempLinkValue && tempLinkValue.trim() !== '' && !validateURL(tempLinkValue)) {
      toast.error('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      // Update project and use returned updated project
      const updatedProject = await updateProject(id, { [field]: tempLinkValue });
      setProject(updatedProject);

      setEditingLink(null);
      setTempLinkValue('');
      const fieldNames: Record<typeof field, string> = {
        repoLink: 'Repository link',
        liveLink: 'Live link',
        completionVideoLink: 'Completion video link',
      };
      toast.success('Link updated', `${fieldNames[field]} has been ${tempLinkValue ? 'updated' : 'removed'}`);
    } catch (err) {
      // Error is handled by toast in context
    }
  };

  const startEditing = (type: 'repo' | 'live' | 'video', currentValue?: string) => {
    setEditingLink(type);
    setTempLinkValue(currentValue || '');
  };


  // Standard separator style since component is not available
  const Separator = () => <div className="h-[1px] w-full bg-border my-8" />;

  return (
    <Layout
      title={project.name}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back
          </Button>
          <Button onClick={() => navigate(`/projects/${project.id}/edit`)}>
            Edit Project
          </Button>
        </div>
      }
    >
      <div className="max-w-3xl pb-12">

        {/* SECTION 1 — PROJECT SUMMARY */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium border inline-flex items-center ${overdue
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                {status}
              </div>
              {/* Overdue Indicator */}
              {overdue && (
                <span className="text-red-700 font-medium text-xs bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  Overdue
                </span>
              )}

              {/* Status Actions */}

              {status === 'Ready to Deliver' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white ml-2"
                  onClick={() => handleStatusUpdate('delivered')}
                  disabled={statusUpdating || dueAmount > 0}
                >
                  {statusUpdating ? 'Updating...' : 'Mark as Delivered'}
                </Button>
              )}

            </div>

            {/* Status Guidance */}
            {status === 'Completed (Payment Pending)' && (
              <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                Delivery is paused until payment is settled.
              </p>
            )}

            {status === 'Ready to Deliver' && (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                Payment settled. Ready for delivery.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-16">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Amount Due
              </p>
              <p className={`text-4xl sm:text-5xl font-semibold tracking-tight ${dueAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {dueAmount === 0 ? 'Settled' : formatINR(dueAmount)}
              </p>
            </div>

            <div className="pb-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Deadline
              </p>
              <p className="text-xl font-medium text-slate-700">
                {formatDate(project.deadline)}
              </p>            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION 2 — PAYMENT DETAILS */}
        <section>
          <Card className="rounded-xl overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="pb-2 pt-6 px-6">
              <CardTitle className="text-base font-semibold text-slate-800">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Project Value</span>
                <span className="font-semibold text-base">{formatINR(project.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Advance Received</span>
                <span className="font-medium text-slate-600">{formatINR(project.advanceReceived)}</span>
              </div>

              <div className="py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-muted-foreground">Total Received {project.advanceReceived > 0 && <span className="text-xs text-muted-foreground/70">(incl. Advance)</span>}</span>
                  <span className="font-medium">{formatINR(project.totalReceived)}</span>
                </div>

                {isAddingPayment ? (
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mt-2 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Record New Payment</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-slate-400">₹</span>
                        <input
                          type="number"
                          autoFocus
                          placeholder="Amount"
                          step="1"
                          className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePaymentSubmit()}
                        />
                      </div>
                      <Button size="sm" onClick={handlePaymentSubmit} disabled={!paymentAmount || Number(paymentAmount) <= 0}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setIsAddingPayment(false); setPaymentAmount(''); }}>Cancel</Button>
                    </div>
                    {Number(paymentAmount) > dueAmount && (
                      <p className="text-xs text-amber-600 font-medium">
                        Note: Payment exceeds due amount
                      </p>
                    )}
                    {paymentError && <p className="text-xs text-red-500">{paymentError}</p>}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingPayment(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-1 mt-1"
                  >
                    + Record Payment
                  </button>
                )}
              </div>
              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between items-center text-base">
                <span className="font-semibold">Due Amount</span>
                <span className={`font-semibold ${dueAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {formatINR(dueAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* SECTION 3 — PROJECT LINKS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Project Links
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Stored for future reference
              </p>
            </div>
            {status === 'Delivered' && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wide font-bold">
                Delivered
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
            {/* Repo Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 mb-1">Source Code Repository</p>
                {editingLink === 'repo' ? (
                  <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      className="flex-1 text-sm border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={tempLinkValue}
                      onChange={(e) => setTempLinkValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleLinkUpdate('repoLink')}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingLink(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  project.repoLink ? (
                    <a href={project.repoLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                      {project.repoLink}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">Not added</span>
                  )
                )}
              </div>
              {editingLink !== 'repo' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('repo', project.repoLink)}
                  className={project.repoLink ? "text-slate-500 hover:text-slate-900" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}
                >
                  {project.repoLink ? 'Edit' : 'Add Link'}
                </Button>
              )}
            </div>

            {/* Live Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 mb-1">Live Website</p>
                {editingLink === 'live' ? (
                  <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <input
                      type="url"
                      placeholder="https://..."
                      className="flex-1 text-sm border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={tempLinkValue}
                      onChange={(e) => setTempLinkValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleLinkUpdate('liveLink')}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingLink(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  project.liveLink ? (
                    <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                      {project.liveLink}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">Not added</span>
                  )
                )}
              </div>
              {editingLink !== 'live' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('live', project.liveLink)}
                  className={project.liveLink ? "text-slate-500 hover:text-slate-900" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}
                >
                  {project.liveLink ? 'Edit' : 'Add Link'}
                </Button>
              )}
            </div>

            {/* Video Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 mb-1">Completion Video</p>
                {editingLink === 'video' ? (
                  <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <input
                      type="url"
                      placeholder="https://loom.com/..."
                      className="flex-1 text-sm border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={tempLinkValue}
                      onChange={(e) => setTempLinkValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleLinkUpdate('completionVideoLink')}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingLink(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  project.completionVideoLink ? (
                    <a href={project.completionVideoLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                      {project.completionVideoLink}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">Not added</span>
                  )
                )}
              </div>
              {editingLink !== 'video' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('video', project.completionVideoLink)}
                  className={project.completionVideoLink ? "text-slate-500 hover:text-slate-900" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}
                >
                  {project.completionVideoLink ? 'Edit' : 'Add Link'}
                </Button>
              )}
            </div>
          </div>

          {/* Delivered Footer Message */}
          {status === 'Delivered' && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-lg text-sm text-center font-medium">
              Project delivered on {formatDate(project.deliveredAt || '')}
            </div>
          )}
        </section>

        <Separator />

        {/* SECTION 4 — PROJECT DETAILS */}
        <section className="space-y-6">
          <h3 className="text-lg font-semibold tracking-tight">Project Specifications</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div>
              <h4 className="font-medium text-muted-foreground mb-1.5">Client</h4>
              <p className="font-medium">{project.clientName || '—'}</p>
            </div>
            <div>
              <h4 className="font-medium text-muted-foreground mb-1.5">Type</h4>
              <p className="capitalize font-medium">{project.type}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-muted-foreground mb-1.5">Tech Stack</h4>
              <p className="font-medium">{project.techStack || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-muted-foreground mb-1.5">Deliverables</h4>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{project.deliverables || '—'}</p>
            </div>


          </div>
        </section>

        <Separator />

        {/* SECTION 5 — PARTNER SHARE (RECORD ONLY) */}
        <section className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              Partner Share Record
            </h3>
            <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 bg-gray-100 rounded">INTERNAL</span>
          </div>

          <div className="space-y-4">
            {/* HARSHK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-800 w-24">Harshk</span>
              <div className="flex gap-4 sm:gap-12 flex-1">
                <div>
                  <span className="block text-gray-400 text-xs mb-0.5">Share Given</span>
                  <span className="font-semibold text-gray-700">
                    {project.harshkShareGiven ? formatINR(project.harshkShareGiven) : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 text-xs mb-0.5">Date Processed</span>
                  <span className="font-medium text-gray-700">
                    {project.harshkShareDate ? formatDate(project.harshkShareDate) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* NIKKU */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
              <span className="font-semibold text-gray-800 w-24">Nikku</span>
              <div className="flex gap-4 sm:gap-12 flex-1">
                <div>
                  <span className="block text-gray-400 text-xs mb-0.5">Share Given</span>
                  <span className="font-semibold text-gray-700">
                    {project.nikkuShareGiven ? formatINR(project.nikkuShareGiven) : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 text-xs mb-0.5">Date Processed</span>
                  <span className="font-medium text-gray-700">
                    {project.nikkuShareDate ? formatDate(project.nikkuShareDate) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-4">
            * This share is independent of client payments and is recorded here for administrative purposes only.
          </p>
        </section>

      </div>
    </Layout>
  );
}
