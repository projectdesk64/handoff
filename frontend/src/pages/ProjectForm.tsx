import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../models/Project';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

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
  }, [id, isEditing, fetchProject]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalAmount' || name === 'advanceReceived' || name === 'totalReceived' || name === 'partnerShareGiven'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Back to Projects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Project' : 'New Project'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Client Name</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                name="type"
                value={formData.type || 'software'}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deadline *</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Amount *</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount || 0}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Advance Received</label>
              <input
                type="number"
                name="advanceReceived"
                value={formData.advanceReceived || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Received</label>
              <input
                type="number"
                name="totalReceived"
                value={formData.totalReceived || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Completed At</label>
                  <input
                    type="datetime-local"
                    name="completedAt"
                    value={formData.completedAt ? new Date(formData.completedAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        completedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Delivered At</label>
                  <input
                    type="datetime-local"
                    name="deliveredAt"
                    value={formData.deliveredAt ? new Date(formData.deliveredAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        deliveredAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Completion Video Link</label>
                  <input
                    type="url"
                    name="completionVideoLink"
                    value={formData.completionVideoLink || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Completion Notes</label>
                  <textarea
                    name="completionNotes"
                    value={formData.completionNotes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Repository Link</label>
                  <input
                    type="url"
                    name="repoLink"
                    value={formData.repoLink || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Live Link</label>
                  <input
                    type="url"
                    name="liveLink"
                    value={formData.liveLink || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Notes</label>
                  <textarea
                    name="deliveryNotes"
                    value={formData.deliveryNotes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tech Stack (JSON array)</label>
                  <textarea
                    name="techStack"
                    value={formData.techStack || ''}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder='["React", "TypeScript", "Go"]'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Deliverables (JSON array)</label>
                  <textarea
                    name="deliverables"
                    value={formData.deliverables || ''}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder='["Website", "API", "Documentation"]'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Internal Notes</label>
                  <textarea
                    name="internalNotes"
                    value={formData.internalNotes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

