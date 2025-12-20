import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../models/Project';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Layout } from '../components/Layout';

export function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createProject, updateProject, fetchProject, loading } = useProjects();
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
    try {
      if (isEditing && id) {
        await updateProject(id, formData);
      } else {
        await createProject(formData as Omit<Project, 'id' | 'createdAt'>);
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to save project:', error);
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalAmount' || name === 'advanceReceived' || name === 'totalReceived' || name === 'partnerShareGiven'
        ? parseInt(value) || 0
        : value,
    }));
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
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Project Info</h3>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Project Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. E-commerce Platform Redesign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName || ''}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Project Type *</label>
                  <select
                    name="type"
                    value={formData.type || 'software'}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Tech Stack (JSON)</label>
                    <textarea
                      name="techStack"
                      value={formData.techStack || ''}
                      onChange={handleChange}
                      rows={2}
                      placeholder='["React", "Node.js"]'
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Deliverables (JSON)</label>
                    <textarea
                      name="deliverables"
                      value={formData.deliverables || ''}
                      onChange={handleChange}
                      rows={2}
                      placeholder='["Source Code", "Documentation"]'
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* SECTION 2 — FINANCIALS */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Financials</h3>
            <Card className="bg-gray-50/50 border-gray-200">
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Total Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount || 0}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Advance Received</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="advanceReceived"
                      value={formData.advanceReceived || 0}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Total Received</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="totalReceived"
                      value={formData.totalReceived || 0}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-gray-500 px-1">All amounts are in Indian Rupees (₹)</p>
          </section>

          {/* SECTION 3 — TIMELINE */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Deadline *</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}

              {isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Completed At</label>
                    <input
                      type="datetime-local"
                      name="completedAt"
                      value={toLocalISOString(formData.completedAt)}
                      onChange={handleDateTimeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Delivered At</label>
                    <input
                      type="datetime-local"
                      name="deliveredAt"
                      value={toLocalISOString(formData.deliveredAt)}
                      onChange={handleDateTimeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* SECTION 4 — PARTNER SHARE */}
          <section className="space-y-4 opacity-90">
            <div className="flex items-center gap-2 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-700">Partner Share</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">Internal</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Share Given (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">₹</span>
                  <input
                    type="number"
                    name="partnerShareGiven"
                    value={formData.partnerShareGiven || 0}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Date Given</label>
                <input
                  type="date"
                  name="partnerShareDate"
                  value={formData.partnerShareDate ? new Date(formData.partnerShareDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      partnerShareDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              {isEditing && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-600">Internal Notes</label>
                  <textarea
                    name="internalNotes"
                    value={formData.internalNotes || ''}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              )}
            </div>
          </section>

          {/* SECTION 5 — DELIVERY INFO (OPTIONAL) */}
          {isEditing && (
            <section className="space-y-4 border-t pt-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900">Delivery Info <span className="text-gray-400 font-normal text-sm ml-2">(Optional)</span></h3>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Completion Video Link</label>
                    <input
                      type="url"
                      name="completionVideoLink"
                      value={formData.completionVideoLink || ''}
                      onChange={handleChange}
                      placeholder="https://loom.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Repository Link</label>
                    <input
                      type="url"
                      name="repoLink"
                      value={formData.repoLink || ''}
                      onChange={handleChange}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Live Link</label>
                  <input
                    type="url"
                    name="liveLink"
                    value={formData.liveLink || ''}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Completion Notes</label>
                    <textarea
                      name="completionNotes"
                      value={formData.completionNotes || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Delivery Notes</label>
                    <textarea
                      name="deliveryNotes"
                      value={formData.deliveryNotes || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
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

