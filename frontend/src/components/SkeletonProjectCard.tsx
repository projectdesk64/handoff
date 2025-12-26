import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function SkeletonProjectCard() {
    return (
        <Card className="border-border">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="flex items-end justify-between border-t pt-4">
                        <div className="flex gap-8 sm:gap-12">
                            <div>
                                <Skeleton className="h-3 w-20 mb-1" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <div>
                                <Skeleton className="h-3 w-16 mb-1" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-16" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
