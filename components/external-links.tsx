const CONGREGATION_URL =
  "https://hub.jw.org/meetings/ko?q=%7B%22meetingType%22%3A%22meetings%22%2C%22location%22%3A%22%22%7D"
const STREAM_URL = "https://stream.jw.org/home"

export default function ExternalLinks() {
  return (
    <div className="flex gap-3">
      <a
        href={CONGREGATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-btn flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/80 text-center"
      >
        회중찾기
      </a>
      <a
        href={STREAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-btn flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/80 text-center"
      >
        Stream
      </a>
    </div>
  )
}
