import gitDiffParser from 'gitdiff-parser'

export function diffToJson(diffText: string) {
  const files = gitDiffParser.parse(diffText).map((file) => ({
    oldPath: file.oldPath,
    newPath: file.newPath,
    hunks: file.hunks.map((hunk) => ({
      changes: hunk.changes.map((chg) => {
        if (chg.type === 'normal') {
          return {
            type: chg.type,
            content: chg.content.trimEnd(),
            oldLineNumber: chg.oldLineNumber,
            newLineNumber: chg.newLineNumber,
          }
        } else {
          return {
            type: chg.type,
            content: chg.content.trimEnd(),
            lineNumber: chg.lineNumber,
          }
        }
      }),
    })),
  }))

  return { files }
}
