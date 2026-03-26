'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';

export default function AdminBankImport() {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const res = await fetch('/api/admin/bank/versions');
      if (res.ok) setVersions(await res.json());
    } catch (e) { console.error('Failed to fetch versions', e); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setErrors([]);
    setResult(null);
    setPublished(false);

    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);

    try {
      const res = await fetch('/api/admin/bank/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors([data.message || 'Import failed']);
        }
      }
    } catch (err) {
      setErrors(['An unexpected error occurred.']);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!result?.payload) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/bank/import', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', description, payload: result.payload })
      });
      if (res.ok) {
        setPublished(true);
        fetchVersions();
      } else {
        const data = await res.json();
        setErrors([data.message || 'Failed to publish version']);
      }
    } catch (err) {
      setErrors(['Unexpected error while publishing']);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl mb-8">Question Bank Management</h1>

      <div className="p-8 max-w-2xl border border-border bg-card">
        <h2 className="text-2xl mb-4">Import New Version</h2>
        <p className="text-muted-foreground mb-6">
          Upload the master Excel workbook containing Questions, Dimensions, and Competencies sheets. 
          This will validate the structure before creating a Draft version.
        </p>

        <div className="flex flex-col gap-4">
          <input 
            type="file" 
            accept=".xlsx" 
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-glow"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Version Description (Optional)</label>
            <textarea 
              className="w-full bg-muted border border-border p-3 text-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g., Updated scenario logic for Q2 2024"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={handleUpload} disabled={!file || loading} className="w-fit">
            {loading ? 'Processing...' : 'Upload & Validate'}
          </Button>

          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
              <h3 className="font-bold mb-2">Validation Failed:</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {result && !published && (
            <div className="mt-4 p-6 bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-lg text-blue-600 dark:text-blue-300">Validation Successful</h3>
                <Badge color="info">Ready to Publish</Badge>
              </div>
              <ul className="list-disc pl-5 text-sm mb-6 text-blue-700 dark:text-blue-200">
                <li>Active Questions: {result.questionCount}</li>
                <li>Dimensions Configured: {result.dimensionCount}</li>
                <li>Competencies Configured: {result.competencyCount}</li>
              </ul>
              
              <div className="pt-4 border-t border-blue-500/20">
                <p className="text-sm mb-4">Review the counts above. Publishing will set this version live and archive the previous one.</p>
                <Button onClick={handlePublish} disabled={isPublishing} className="w-full bg-green-600 hover:bg-green-500">
                  {isPublishing ? 'Publishing...' : 'Approve & Publish'}
                </Button>
              </div>
            </div>
          )}

          {published && (
            <div className="mt-4 p-6 bg-green-500/10 border border-green-500/50 text-green-700 dark:text-green-300 text-center">
              <h3 className="text-xl font-bold mb-2">Version {result?.versionId} Published Successfully!</h3>
              <p className="text-sm">This bank version is now live for all new assessment sessions.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl mb-6">Version History</h2>
        <div className="overflow-hidden border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="p-4 font-medium text-muted-foreground">Version ID</th>
                  <th className="p-4 font-medium text-muted-foreground">Status</th>
                  <th className="p-4 font-medium text-muted-foreground">Description</th>
                  <th className="p-4 font-medium text-muted-foreground">Questions</th>
                  <th className="p-4 font-medium text-muted-foreground">Published At</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.versionId} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="p-4 text-foreground">v{v.versionId}</td>
                    <td className="p-4">
                      {v.status === 'live' ? <Badge color="success">Live</Badge> : 
                       v.status === 'archived' ? <Badge color="warning">Archived</Badge> : 
                       <Badge>Draft</Badge>}
                    </td>
                    <td className="p-4 text-muted-foreground text-sm max-w-xs truncate" title={v.description}>
                      {v.description || <span className="text-muted-foreground/50 italic">No description</span>}
                    </td>
                    <td className="p-4 text-muted-foreground">{v.questionCount}</td>
                    <td className="p-4 text-muted-foreground">{new Date(v.publishedAt).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a 
                          href={`/api/admin/bank/versions/${v.versionId}?format=excel`}
                          download
                          title="Download Excel"
                          className="p-2 hover:bg-muted text-green-500 dark:text-green-400 transition-colors"
                        >
                          <FileSpreadsheet size={18} />
                        </a>
                        <a 
                          href={`/api/admin/bank/versions/${v.versionId}?format=json`}
                          download
                          title="Download JSON"
                          className="p-2 hover:bg-muted text-blue-500 dark:text-blue-400 transition-colors"
                        >
                          <FileJson size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {versions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground italic">No versions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
