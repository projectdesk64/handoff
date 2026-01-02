import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';
import { ExpandCollapse } from '../components/ExpandCollapse';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { Project } from '../models/Project';
import { SkeletonProjectDetail } from '../components/SkeletonProjectDetail';
import { getProjectStatus, getDueAmount, isOverdue, getMissingCompletionRequirements, getMissingDeliveryRequirements } from '../utils/status';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { SmartStack } from '../components/SmartStack';

import { Layout } from '../components/Layout';
import { validateURL } from '../utils/validation';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, fetchProject, updateProject, loading: globalLoading, error } = useProjects();

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
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Status UX State
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Handover UX State
  const [editingLink, setEditingLink] = useState<'repo' | 'live' | 'video' | null>(null);
  const [tempLinkValue, setTempLinkValue] = useState('');
  const [linkSuccess, setLinkSuccess] = useState<{ id: string, message: string } | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject(id)
        .then(setProject)
        .finally(() => setIsInitializing(false));
    }
  }, [id, fetchProject]);

  // Show loading only if we have no project data and are fetching/initializing
  if ((globalLoading || isInitializing) && !project) {
    return <SkeletonProjectDetail />;
  }

  // Show error only if we aren't loading and still have no project
  if (error || (!project && !isInitializing && !globalLoading)) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-destructive mb-4">Error: {error || 'Project not found'}</div>
          <Button onClick={() => navigate('/')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  const status = getProjectStatus(project);
  const dueAmount = getDueAmount(project);
  const overdue = isOverdue(project);

  const missingCompletionDetails = getMissingCompletionRequirements(project);
  const missingDeliveryDetails = getMissingDeliveryRequirements(project);

  const handleStatusUpdate = async (type: 'delivered' | 'completed') => {
    if (!project || !id) return;
    setStatusUpdating(true);
    try {
      const updates: Partial<Project> = {};
      const now = new Date().toISOString();

      if (type === 'delivered') {
        updates.deliveredAt = now;
      } else if (type === 'completed') {
        updates.completedAt = now;
      }

      // Update project and use returned updated project
      const updatedProject = await updateProject(id, updates);
      setProject(updatedProject);
      setStatusSuccess('Project status updated');
      setTimeout(() => setStatusSuccess(null), 3000);
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
      setPaymentSuccess(`Payment recorded: ${formatINR(amountToAdd)}`);
      setTimeout(() => setPaymentSuccess(null), 3000);

    } catch (err) {
      setPaymentError('Failed to save payment. Please try again.');
      // Error toast is handled by context
    }
  };

  const handleLinkUpdate = async (field: 'repoLink' | 'liveLink' | 'completionVideoLink') => {
    if (!project || !id) return;

    // Validation
    if (tempLinkValue && tempLinkValue.trim() !== '' && !validateURL(tempLinkValue)) {
      setLinkError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setLinkError(null);

    try {
      // Update project and use returned updated project
      const updatedProject = await updateProject(id, { [field]: tempLinkValue });
      setProject(updatedProject);

      setEditingLink(null);
      setTempLinkValue('');
      const fieldNames: Record<typeof field, string> = {
        repoLink: 'Repository',
        liveLink: 'Live site',
        completionVideoLink: 'Video',
      };
      setLinkSuccess({ id: field, message: `${fieldNames[field]} updated` });
      setTimeout(() => setLinkSuccess(null), 3000);
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

  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
    />
  );

  return (
    <Layout
      title={project.name}
      actions={
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
              Edit
            </Button>

            {status === 'Ready to Deliver' && (
              <Button
                className="bg-success hover:bg-success/90 text-primary-foreground"
                onClick={() => handleStatusUpdate('delivered')}
                disabled={statusUpdating || dueAmount > 0 || missingDeliveryDetails.length > 0}
              >
                {statusUpdating ? (
                  <>
                    <LoadingSpinner />
                    Updating...
                  </>
                ) : (
                  'Mark as Delivered'
                )}
              </Button>
            )}

            {status === 'In Progress' && (
              <Button
                onClick={() => handleStatusUpdate('completed')}
                disabled={statusUpdating || missingCompletionDetails.length > 0}
              >
                {statusUpdating ? (
                  <>
                    <LoadingSpinner />
                    Updating...
                  </>
                ) : (
                  'Mark as Completed'
                )}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {status === 'Ready to Deliver' && (
              <div className="flex flex-col items-end">
                {missingDeliveryDetails.length > 0 && (
                  <FeedbackMessage type="info" className="text-[10px] text-right">
                    Missing: {missingDeliveryDetails.join(', ')}
                  </FeedbackMessage>
                )}
                {dueAmount > 0 && (
                  <FeedbackMessage type="warning" className="text-[10px] text-right">
                    Payment pending
                  </FeedbackMessage>
                )}
              </div>
            )}

            {status === 'In Progress' && missingCompletionDetails.length > 0 && (
              <div className="flex flex-col items-end">
                <FeedbackMessage type="info" className="text-[10px] text-right">
                  Missing: {missingCompletionDetails.join(', ')}
                </FeedbackMessage>
              </div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      <div className="max-w-3xl mx-auto pb-12">

        {/* SECTION 1 — PROJECT SUMMARY */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium border inline-flex items-center transition-colors ${status === 'Delivered'
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                : status === 'In Progress'
                  ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                  : status === 'Ready to Deliver' || status === 'Completed (Payment Pending)'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                    : overdue
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-muted text-muted-foreground border-border'
                }`}>
                {status}
              </div>
              {/* Overdue Indicator */}
              {overdue && (
                <span className="text-destructive font-medium text-xs bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                  Overdue
                </span>
              )}
              {statusSuccess && (
                <FeedbackMessage type="success" className="ml-2">
                  {statusSuccess}
                </FeedbackMessage>
              )}



            </div>

            {/* Status Guidance */}
            <AnimatePresence>
              {status === 'Completed (Payment Pending)' && (
                <ExpandCollapse key="status-pending">
                  <p className="text-sm text-warning font-medium flex items-center gap-2">
                    Delivery is paused until payment is settled.
                  </p>
                </ExpandCollapse>
              )}

              {status === 'Ready to Deliver' && (
                <ExpandCollapse key="status-ready">
                  <p className="text-sm text-success font-medium flex items-center gap-2">
                    Payment settled. Ready for delivery.
                  </p>
                </ExpandCollapse>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-16">
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Amount Due
              </p>
              <p className={`text-4xl sm:text-5xl font-semibold tracking-tight ${dueAmount > 0 ? 'text-warning' : 'text-success'}`}>
                {dueAmount === 0 ? 'Settled' : formatINR(dueAmount)}
              </p>
            </div>

            <div className="pb-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Deadline
              </p>
              <p className="text-xl font-medium text-foreground">
                {formatDate(project.deadline)}
              </p>            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION 2 — PAYMENT DETAILS */}
        <section>
          <Card className="rounded-xl overflow-hidden border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-6 px-6">
              <h2 className="text-base font-semibold text-foreground leading-none tracking-tight">Payment Details</h2>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Project Value</span>
                <span className="font-semibold text-base">{formatINR(project.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Advance Received</span>
                <span className="font-medium text-muted-foreground">{formatINR(project.advanceReceived)}</span>
              </div>

              <div className="py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-muted-foreground">Total Received {project.advanceReceived > 0 && <span className="text-xs text-muted-foreground/70">(incl. Advance)</span>}</span>
                  <span className="font-medium">{formatINR(project.totalReceived)}</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {isAddingPayment ? (
                    <ExpandCollapse key="payment-form">
                      <div className="bg-muted/50 p-3 rounded-md border border-border mt-2 space-y-3">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Record New Payment</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                            <input
                              type="number"
                              autoFocus
                              placeholder="Amount"
                              step="1"
                              className="w-full pl-7 pr-3 py-1.5 text-sm border border-input rounded-md bg-transparent transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handlePaymentSubmit()}
                            />
                          </div>
                          <Button size="sm" onClick={handlePaymentSubmit} disabled={!paymentAmount || Number(paymentAmount) <= 0}>
                            {isAddingPayment && !paymentAmount ? 'Save' : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setIsAddingPayment(false); setPaymentAmount(''); }}>Cancel</Button>
                        </div>
                        {Number(paymentAmount) > dueAmount && (
                          <FeedbackMessage type="warning">
                            Note: Payment exceeds due amount
                          </FeedbackMessage>
                        )}
                        {paymentError && <FeedbackMessage type="error">{paymentError}</FeedbackMessage>}
                      </div>
                    </ExpandCollapse>
                  ) : (
                    <div className="flex items-center gap-3 mt-1">
                      <motion.div
                        key="payment-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={() => setIsAddingPayment(true)}
                          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-2 px-2 py-1 -ml-2 rounded-md hover:bg-primary/5 transition-colors"
                        >
                          + Record Payment
                        </button>
                      </motion.div>
                      <AnimatePresence>
                        {paymentSuccess && (
                          <FeedbackMessage type="success" className="translate-y-1">
                            {paymentSuccess}
                          </FeedbackMessage>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between items-center text-base">
                <span className="font-semibold">Due Amount</span>
                <span className={`font-semibold ${dueAmount > 0 ? 'text-warning' : 'text-success'}`}>
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
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Project Links
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Stored for future reference
              </p>
            </div>
            {status === 'Delivered' && (
              <span className="text-xs bg-success/10 text-success px-2.5 py-1 rounded-full uppercase tracking-wide font-bold">
                Delivered
              </span>
            )}
          </div>

          <div className="divide-y divide-border border-t border-b border-border">
            {/* Repo Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Source Code Repository</p>
                <AnimatePresence mode="wait" initial={false}>
                  {editingLink === 'repo' ? (
                    <ExpandCollapse key="repo-edit">
                      <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                        <input
                          type="url"
                          placeholder="https://github.com/..."
                          className="flex-1 text-sm border border-input rounded-md px-3 py-1.5 bg-transparent transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          value={tempLinkValue}
                          onChange={(e) => setTempLinkValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleLinkUpdate('repoLink')}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingLink(null); setLinkError(null); }}>Cancel</Button>
                        </div>
                      </div>
                      {linkError && <FeedbackMessage type="error">{linkError}</FeedbackMessage>}
                    </ExpandCollapse>
                  ) : (
                    <motion.div
                      key="repo-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3"
                    >
                      {project.repoLink ? (
                        <a href={project.repoLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                          {project.repoLink}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not added</span>
                      )}
                      <AnimatePresence>
                        {linkSuccess?.id === 'repoLink' && (
                          <FeedbackMessage type="success">
                            {linkSuccess.message}
                          </FeedbackMessage>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {editingLink !== 'repo' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('repo', project.repoLink)}
                  className={project.repoLink ? "text-muted-foreground hover:text-foreground" : "text-primary hover:text-primary/90 hover:bg-primary/10"}
                >
                  {project.repoLink ? 'Edit' : 'Add Link'}
                </Button>
              )}
            </div>

            {/* Live Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Live Website</p>
                <AnimatePresence mode="wait" initial={false}>
                  {editingLink === 'live' ? (
                    <ExpandCollapse key="live-edit">
                      <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                        <input
                          type="url"
                          placeholder="https://..."
                          className="flex-1 text-sm border border-input rounded-md px-3 py-1.5 bg-transparent transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          value={tempLinkValue}
                          onChange={(e) => setTempLinkValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleLinkUpdate('liveLink')}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingLink(null); setLinkError(null); }}>Cancel</Button>
                        </div>
                      </div>
                      {linkError && <FeedbackMessage type="error">{linkError}</FeedbackMessage>}
                    </ExpandCollapse>
                  ) : (
                    <motion.div
                      key="live-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3"
                    >
                      {project.liveLink ? (
                        <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                          {project.liveLink}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not added</span>
                      )}
                      <AnimatePresence>
                        {linkSuccess?.id === 'liveLink' && (
                          <FeedbackMessage type="success">
                            {linkSuccess.message}
                          </FeedbackMessage>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {editingLink !== 'live' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('live', project.liveLink)}
                  className={project.liveLink ? "text-muted-foreground hover:text-foreground" : "text-primary hover:text-primary/90 hover:bg-primary/10"}
                >
                  {project.liveLink ? 'Edit' : 'Add Link'}
                </Button>
              )}
            </div>

            {/* Video Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Completion Video</p>
                <AnimatePresence mode="wait" initial={false}>
                  {editingLink === 'video' ? (
                    <ExpandCollapse key="video-edit">
                      <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                        <input
                          type="url"
                          placeholder="https://loom.com/..."
                          className="flex-1 text-sm border border-input rounded-md px-3 py-1.5 bg-transparent transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          value={tempLinkValue}
                          onChange={(e) => setTempLinkValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleLinkUpdate('completionVideoLink')}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingLink(null); setLinkError(null); }}>Cancel</Button>
                        </div>
                      </div>
                      {linkError && <FeedbackMessage type="error">{linkError}</FeedbackMessage>}
                    </ExpandCollapse>
                  ) : (
                    <motion.div
                      key="video-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3"
                    >
                      {project.completionVideoLink ? (
                        <a href={project.completionVideoLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                          {project.completionVideoLink}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not added</span>
                      )}
                      <AnimatePresence>
                        {linkSuccess?.id === 'completionVideoLink' && (
                          <FeedbackMessage type="success">
                            {linkSuccess.message}
                          </FeedbackMessage>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {editingLink !== 'video' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('video', project.completionVideoLink)}
                  className={project.completionVideoLink ? "text-muted-foreground hover:text-foreground" : "text-primary hover:text-primary/90 hover:bg-primary/10"}
                >
                  {project.completionVideoLink ? 'Edit' : 'Add Link'}
                </Button>
              )}
            </div>
          </div>

          {/* Delivered Footer Message */}
          <AnimatePresence>
            {status === 'Delivered' && (
              <ExpandCollapse key="delivered-msg">
                <div className="bg-success/10 text-success border border-success/20 p-4 rounded-lg text-sm text-center font-medium">
                  Project delivered on {formatDate(project.deliveredAt || '')}
                </div>
              </ExpandCollapse>
            )}
          </AnimatePresence>
        </section>

        <Separator />

        {/* SECTION 4 — PROJECT DETAILS */}
        <section className="space-y-6">
          <Card className="rounded-xl overflow-hidden border-gray-100 shadow-sm bg-card">
            <CardHeader className="pb-2 pt-6 px-6">
              <h2 className="text-base font-semibold text-foreground leading-none tracking-tight">Project Specifications</h2>
            </CardHeader>
            <CardContent className="space-y-8 pt-6 text-sm">

              {/* Client & Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client</h3>
                  <p className="font-medium text-foreground text-base">{project.clientName || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Type</h3>
                  <p className="capitalize font-medium text-foreground text-base">{project.type}</p>
                </div>
              </div>

              {/* Tech Stack - Smart Grid */}
              <div className="border-t border-border/50 pt-6">
                <h3 className="font-medium text-muted-foreground mb-3">Tech Stack</h3>
                {project.techStack ? (
                  <SmartStack techs={Array.isArray(project.techStack) ? project.techStack : (project.techStack as string).split(',').map(s => s.trim())} />
                ) : (
                  <p className="text-muted-foreground italic">No details available</p>
                )}
              </div>

              {/* Deliverables - Clean Minimal List */}
              <div className="border-t border-border/50 pt-6">
                <h3 className="font-medium text-muted-foreground mb-1.5">Deliverables</h3>
                {(() => {
                  if (!project.deliverables) return <p className="text-muted-foreground italic text-sm">—</p>;

                  const delivString = project.deliverables + "";
                  let rawItems: string[] = [];
                  if (delivString.includes('\n')) {
                    rawItems = delivString.split('\n');
                  } else {
                    rawItems = delivString.split(',');
                  }
                  
                  // Parse hierarchy
                  interface DeliverableItem {
                    text: string;
                    subItems: string[];
                  }
                  
                  const structuredItems: DeliverableItem[] = [];
                  let currentMain: DeliverableItem | null = null;

                  rawItems.forEach(raw => {
                    const trimmed = raw.trim();
                    if (!trimmed) return;

                    if (trimmed.startsWith('-')) {
                      // Sub-item
                      const content = trimmed.substring(1).trim();
                      if (currentMain) {
                        currentMain.subItems.push(content);
                      } else {
                        // Orphan sub-item, treat as main
                        currentMain = { text: content, subItems: [] };
                        structuredItems.push(currentMain);
                      }
                    } else {
                      // Main item
                      currentMain = { text: trimmed, subItems: [] };
                      structuredItems.push(currentMain);
                    }
                  });

                  if (structuredItems.length === 0) return <p className="text-muted-foreground italic text-sm">—</p>;

                  return (
                    <div className="space-y-4 mt-3">
                      {structuredItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          {/* Main Item */}
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 shrink-0">
                              <svg
                                className="w-3 h-3 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-foreground leading-relaxed">{item.text}</span>
                          </div>

                          {/* Sub Items */}
                          {item.subItems.length > 0 && (
                            <div className="ml-2.5 pl-5 border-l-2 border-border/40 space-y-1.5 mt-1">
                              {item.subItems.map((sub, subIdx) => (
                                <div key={subIdx} className="flex items-start gap-2 text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                                  <span className="text-sm leading-relaxed">{sub}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* SECTION 5 — PARTNER SHARE (RECORD ONLY) */}
        <section className="bg-muted/50 p-4 rounded-lg border border-dashed border-border mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Partner Share Record
            </h2>
            <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded">INTERNAL</span>
          </div>

          <div className="space-y-4">
            {/* HARSHK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm border-b border-border pb-2">
              <span className="font-semibold text-foreground w-24">Harshk</span>
              <div className="flex gap-4 sm:gap-12 flex-1">
                <div>
                  <span className="block text-muted-foreground text-xs mb-0.5">Share Given</span>
                  <span className="font-semibold text-foreground">
                    {project.harshkShareGiven ? formatINR(project.harshkShareGiven) : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground text-xs mb-0.5">Date Processed</span>
                  <span className="font-medium text-foreground">
                    {project.harshkShareDate ? formatDate(project.harshkShareDate) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* NIKKU */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
              <span className="font-semibold text-foreground w-24">Nikku</span>
              <div className="flex gap-4 sm:gap-12 flex-1">
                <div>
                  <span className="block text-muted-foreground text-xs mb-0.5">Share Given</span>
                  <span className="font-semibold text-foreground">
                    {project.nikkuShareGiven ? formatINR(project.nikkuShareGiven) : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground text-xs mb-0.5">Date Processed</span>
                  <span className="font-medium text-foreground">
                    {project.nikkuShareDate ? formatDate(project.nikkuShareDate) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-4">
            * This share is independent of client payments and is recorded here for administrative purposes only.
          </p>
        </section>

      </div>
    </Layout>
  );
}
