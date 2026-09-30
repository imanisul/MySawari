import re

with open('/Users/anisulislam/Desktop/MySawari/components/common/ErrorFallback.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useColors } from '@/hooks/useColors';", "")
content = content.replace("  const colors = useColors();\n", "")

# Replace colors
replacements = {
    "colors.background": "'#111827'",
    "colors.card": "'#1F2937'",
    "colors.foreground": "'#F9FAFB'",
    "colors.mutedForeground": "'#9CA3AF'",
    "colors.muted": "'#374151'",
    "colors.destructive || '#FF3B30'": "'#FF3B30'",
    "colors.primary": "'#0EA5E9'",
    "colors.primaryText": "'#FFFFFF'",
    "colors.primaryForeground": "'#FFFFFF'"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('/Users/anisulislam/Desktop/MySawari/components/common/ErrorFallback.tsx', 'w') as f:
    f.write(content)
