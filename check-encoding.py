#!/usr/bin/env python3
# -*- coding: utf-8 -*-

try:
    with open('app/dashboard/page.tsx', 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
    
    print(f"Fichier lu avec succes: {len(lines)} lignes")
    print("\nRecherche de caracteres suspects...")
    
    for i, line in enumerate(lines[2300:2500], start=2301):
        # Chercher des caractères non-ASCII
        suspicious = []
        for j, char in enumerate(line):
            if ord(char) > 127 and char not in 'éèêëàâäôöùûüçÉÈÊËÀÂÄÔÖÙÛÜÇ€':
                suspicious.append((j, char, ord(char)))
        
        if suspicious:
            print(f"\nLigne {i}: {line.strip()[:50]}")
            for pos, char, code in suspicious:
                print(f"  Position {pos}: '{char}' (U+{code:04X})")
    
    print("\nVerification terminee.")
    
except Exception as e:
    print(f"Erreur: {e}")
