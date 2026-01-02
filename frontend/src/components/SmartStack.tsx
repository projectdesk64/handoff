interface SmartStackProps {
    techs?: string[];
    className?: string;
}

export function SmartStack({ techs = [], className = '' }: SmartStackProps) {
    if (!techs || techs.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">No tech stack specified</p>
        );
    }

    return (
        <ol className={`list-decimal list-inside space-y-1 ${className}`}>
            {techs.map((tech, index) => (
                <li
                    key={`${tech}-${index}`}
                    className="text-sm text-foreground"
                >
                    {tech.trim()}
                </li>
            ))}
        </ol>
    );
}
