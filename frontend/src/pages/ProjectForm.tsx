import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../models/Project';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Layout } from '../components/Layout';
import { validateProject, validateURL, validateJSON } from '../utils/validation';
import { useToast } from '../context/ToastContext';

export function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createProject, updateProject, fetchProject, loading } = useProjects();
  const toast = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    clientName: '',
    description: '',
    type: 'software',
    deadline: '',
    totalAmount: 0,
    advanceReceived: 0,
    totalReceived: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isEditing && id) {
      fetchProject(id).then((project) => {
        if (project) {
          setFormData(project);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateProject(formData);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      toast.error('Validation failed', 'Please fix the errors in the form');
      return;
    }

    try {
      if (isEditing && id) {
        await updateProject(id, formData);
      } else {
        await createProject(formData as Omit<Project, 'id' | 'createdAt'>);
      }
      navigate('/');
    } catch (error) {
      // Error is handled by toast in context
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate individual field
    if (field === 'repoLink' || field === 'liveLink' || field === 'completionVideoLink') {
      if (formData[field as keyof Project] && !validateURL(formData[field as keyof Project] as string)) {
        setErrors((prev) => ({ ...prev, [field]: 'Invalid URL format' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } else if (field === 'techStack' || field === 'deliverables') {
      if (formData[field as keyof Project] && !validateJSON(formData[field as keyof Project] as string)) {
        setErrors((prev) => ({ ...prev, [field]: 'Invalid JSON format' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  // Helper to convert UTC ISO string to Local ISO string (YYYY-MM-DDTHH:mm) for datetime-local input
  const toLocalISOString = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Convert to local time by subtracting the timezone offset
    // offset is in minutes (positive if behind UTC, negative if ahead)
    // india is -330 (UTC+5:30) => date.getTime() - (-330 * 60000) = date.getTime() + 5.5 hours
    const localTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localTime.toISOString().slice(0, 16);
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // value is "2023-10-27T10:00" (Local time)
    // new Date(value).toISOString() expects value to be local and converts to UTC
    setFormData((prev) => ({
      ...prev,
      [name]: value ? new Date(value).toISOString() : undefined,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let newValue: string | number = value;
      const numericFields = [
        'totalAmount', 'advanceReceived', 'totalReceived',
        'partnerShareGiven', 'harshkShareGiven', 'nikkuShareGiven'
      ];

      if (numericFields.includes(name)) {
        newValue = parseFloat(value) || 0;
      }

      const updates = {
        ...prev,
        [name]: newValue,
      };

      if (name === 'advanceReceived') {
        const newAdvance = newValue as number;
        const oldAdvance = prev.advanceReceived || 0;
        const difference = newAdvance - oldAdvance;
        updates.totalReceived = (prev.totalReceived || 0) + difference;
      }

      return updates;
    });
  };

  return (
    <Layout title={isEditing ? 'Edit Project' : 'New Project'}>
      <div className="max-w-2xl mx-auto pb-12">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Projects
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1 — PROJECT INFO */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Project Info</h3>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Project Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  required
                  placeholder="e.g. E-commerce Platform Redesign"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${errors.name ? 'border-destructive' : 'border-input'
                    }`}
                />
                {errors.name && touched.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName || ''}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Project Type *</label>
                  <select
                    name="type"
                    value={formData.type || 'software'}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  >
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>

              {isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Tech Stack (JSON)</label>
                    <textarea
                      name="techStack"
                      value={formData.techStack || ''}
                      onChange={handleChange}
                      onBlur={() => handleBlur('techStack')}
                      rows={2}
                      placeholder='["React", "Node.js"]'
                      className={`w-full px-3 py-2 border rounded-md font-mono text-sm bg-muted/50 ${errors.techStack ? 'border-destructive' : 'border-input'
                        }`}
                    />
                    {errors.techStack && touched.techStack && (
                      <p className="text-sm text-destructive mt-1">{errors.techStack}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Deliverables (JSON)</label>
                    <textarea
                      name="deliverables"
                      value={formData.deliverables || ''}
                      onChange={handleChange}
                      onBlur={() => handleBlur('deliverables')}
                      rows={2}
                      placeholder='["Source Code", "Documentation"]'
                      className={`w-full px-3 py-2 border rounded-md font-mono text-sm bg-muted/50 ${errors.deliverables ? 'border-destructive' : 'border-input'
                        }`}
                    />
                    {errors.deliverables && touched.deliverables && (
                      <p className="text-sm text-destructive mt-1">{errors.deliverables}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* SECTION 2 — FINANCIALS */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground pb-2">Financials</h3>
            <Card className="bg-muted/30 border-border shadow-sm">
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Total Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount || 0}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Advance Received</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      name="advanceReceived"
                      value={formData.advanceReceived || 0}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Total Received</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      name="totalReceived"
                      value={formData.totalReceived || 0}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground px-1">All amounts are in Indian Rupees (₹)</p>
          </section>

          {/* SECTION 3 — TIMELINE */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Deadline *</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Completed At</label>
                    <input
                      type="datetime-local"
                      name="completedAt"
                      value={toLocalISOString(formData.completedAt)}
                      onChange={handleDateTimeChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Delivered At</label>
                    <input
                      type="datetime-local"
                      name="deliveredAt"
                      value={toLocalISOString(formData.deliveredAt)}
                      onChange={handleDateTimeChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* SECTION 4 — PARTNER SHARE */}
          <section className="space-y-4 opacity-90">
            <div className="flex items-center gap-2 border-b pb-2">
              <h3 className="text-lg font-semibold text-foreground">Partner Share (Internal)</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border">Internal</span>
            </div>

            {/* HARSHK ROW */}
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Harshk</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Share Given (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      name="harshkShareGiven"
                      value={formData.harshkShareGiven || 0}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Date Given</label>
                  <input
                    type="date"
                    name="harshkShareDate"
                    value={formData.harshkShareDate ? new Date(formData.harshkShareDate).toISOString().slice(0, 10) : ''}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        harshkShareDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* NIKKU ROW */}
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Nikku</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Share Given (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      name="nikkuShareGiven"
                      value={formData.nikkuShareGiven || 0}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Date Given</label>
                  <input
                    type="date"
                    name="nikkuShareDate"
                    value={formData.nikkuShareDate ? new Date(formData.nikkuShareDate).toISOString().slice(0, 10) : ''}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        nikkuShareDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>


          </section>

          {/* SECTION 5 — DELIVERY INFO (OPTIONAL) */}
          {isEditing && (
            <section className="space-y-4 border-t pt-6 mt-8">
              <h3 className="text-lg font-semibold text-foreground">Delivery Info <span className="text-muted-foreground font-normal text-sm ml-2">(Optional)</span></h3>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Completion Video Link</label>
                    <input
                      type="url"
                      name="completionVideoLink"
                      value={formData.completionVideoLink || ''}
                      onChange={handleChange}
                      onBlur={() => handleBlur('completionVideoLink')}
                      placeholder="https://loom.com/..."
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.completionVideoLink ? 'border-destructive' : 'border-input'
                        }`}
                    />
                    {errors.completionVideoLink && touched.completionVideoLink && (
                      <p className="text-sm text-destructive mt-1">{errors.completionVideoLink}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Repository Link</label>
                    <input
                      type="url"
                      name="repoLink"
                      value={formData.repoLink || ''}
                      onChange={handleChange}
                      onBlur={() => handleBlur('repoLink')}
                      placeholder="https://github.com/..."
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.repoLink ? 'border-destructive' : 'border-input'
                        }`}
                    />
                    {errors.repoLink && touched.repoLink && (
                      <p className="text-sm text-destructive mt-1">{errors.repoLink}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Live Link</label>
                  <input
                    type="url"
                    name="liveLink"
                    value={formData.liveLink || ''}
                    onChange={handleChange}
                    onBlur={() => handleBlur('liveLink')}
                    placeholder="https://..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.liveLink ? 'border-destructive' : 'border-input'
                      }`}
                  />
                  {errors.liveLink && touched.liveLink && (
                    <p className="text-sm text-destructive mt-1">{errors.liveLink}</p>
                  )}
                </div>


              </div>
            </section>
          )}

          <div className="pt-8 flex gap-4">
            <Button type="submit" disabled={loading} className="px-8">
              {loading ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

