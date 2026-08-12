import EventEmitter, { EventMap } from 'bare-events'
import Log from 'bare-logger'

interface FileLogOptions {
  /** The size, in bytes, at which the log file is rotated. Default `0`, which disables rotation. */
  maxSize?: number
  /**
   * Given the current log path, returns the path to archive it to before it is rotated. Default
   * `null`, in which case the log is truncated in place. If it throws, rotation falls back to
   * truncation.
   */
  rotate?: (path: string) => string
  /** How often, in milliseconds, the log size is checked against `maxSize`. Default `2000`. */
  rotateInterval?: number
}

interface FileLogEvents extends EventMap {
  /**
   * Emitted after the log file is rotated, with the log `path` and the archive path, or `null` when
   * the log was truncated in place.
   */
  rotate: [path: string, archived: string | null]
}

/** Construct a new `FileLog` that writes to the file at `path`. */
interface FileLog extends EventEmitter<FileLogEvents>, Log, Disposable {
  /**
   * @param label - A short severity label, right-padded to five characters (e.g. `info`, `error`),
   * prefixed to the line ahead of an ISO-8601 timestamp.
   * @param data - Values to format into the log message, using the same formatting as
   * `console.log`.
   */
  append(label: string, ...data: unknown[]): void
  /**
   * Closes the underlying file descriptor and stops the rotation timer. Safe to call more than
   * once.
   */
  close(): void
}

declare class FileLog {
  /**
   * @param path - Path to the log file; opened for appending, and created if it does not exist.
   * @param options - Options controlling log rotation; see [`FileLogOptions`](#filelogoptions).
   */
  constructor(path: string, options?: FileLogOptions)
}

declare namespace FileLog {
  export { FileLogOptions, FileLogEvents }
}

export = FileLog
