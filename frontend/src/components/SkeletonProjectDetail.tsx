import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Layout } from './Layout';

export function SkeletonProjectDetail() {
    // Standard separator style
    const Separator = () => <div className="h-[1px] w-full bg-border my-8" />;

    return (
        <Layout>
            <div className="max-w-3xl mx-auto pb-12">

                {/* SECTION 1 — PROJECT SUMMARY */}
                <section className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Status Badge */}
                            <Skeleton className="h-8 w-32 rounded-full" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-16">
                        <div>
                            <Skeleton className="h-3 w-24 mb-2" />
                            <Skeleton className="h-12 w-48" />
                        </div>

                        <div className="pb-1">
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-7 w-32" />
                        </div>
                    </div>
                </section>

                <Separator />

                {/* SECTION 2 — PAYMENT DETAILS */}
                <section>
                    <Card className="rounded-xl overflow-hidden border-border shadow-sm">
                        <CardHeader className="pb-2 pt-6 px-6">
                            <CardTitle className="text-base font-semibold text-foreground">Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-6 text-sm">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-5 w-24" />
                            </div>

                            <div className="py-2">
                                <div className="flex justify-between items-center mb-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                                <div className="mt-3">
                                    <Skeleton className="h-8 w-32" />
                                </div>
                            </div>
                            <div className="my-2 h-px bg-border" />
                            <div className="flex justify-between items-center text-base">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-6 w-28" />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Separator />

                {/* SECTION 3 — PROJECT LINKS */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                Project Links
                            </h3>
                        </div>
                    </div>

                    <div className="divide-y divide-border border-t border-b border-border">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <Skeleton className="h-5 w-40 mb-2" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                </section>

                <Separator />

                {/* SECTION 4 — PROJECT DETAILS */}
                <section className="space-y-6">
                    <h3 className="text-lg font-semibold tracking-tight">Project Specifications</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="md:col-span-2">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-5 w-full max-w-md" />
                        </div>
                        <div className="md:col-span-2">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full mt-1" />
                            <Skeleton className="h-5 w-3/4 mt-1" />
                        </div>
                    </div>
                </section>

            </div>
        </Layout>
    );
}
