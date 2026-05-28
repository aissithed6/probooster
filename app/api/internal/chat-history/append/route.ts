import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  /**
   * Append un bloc de texte dans `logs/chat-history.md`.
   * Objectif: permettre une sauvegarde persistante de la discussion (copier/coller ou script).
   */
  try {
    const body = await request.json().catch(() => null)
    const text = String(body?.text ?? '').trim()

    if (!text) {
      return NextResponse.json({ error: 'text est requis.' }, { status: 400 })
    }

    const now = new Date()
    const stamp = now.toISOString()

    const projectRoot = process.cwd()
    const logsDir = path.join(projectRoot, 'logs')
    const targetFile = path.join(logsDir, 'chat-history.md')

    const autosaveDir = path.join(projectRoot, '_chat_logs')
    const autosaveFile = path.join(autosaveDir, 'auto-save.md')

    fs.mkdirSync(logsDir, { recursive: true })
    fs.mkdirSync(autosaveDir, { recursive: true })

    const block = `\n\n---\n\n## ${stamp}\n\n${text}\n`
    fs.appendFileSync(targetFile, block, { encoding: 'utf8' })
    fs.appendFileSync(autosaveFile, block, { encoding: 'utf8' })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Erreur serveur.' }, { status: 500 })
  }
}
