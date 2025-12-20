export function formatDate(date: string | Date | undefined | null): string {
    if (!date) return '—';
    const d = new Date(date);
    // Ensure valid date
    if (isNaN(d.getTime())) return '—';

    // Format as DD/MM/YYYY
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
