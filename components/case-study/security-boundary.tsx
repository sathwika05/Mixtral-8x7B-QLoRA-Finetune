/**
 * The trust boundary. Deliberately avoids naming the secret environment
 * variables: the boundary test rejects those literals anywhere under the
 * presentation directories, including in a diagram label.
 */
export function SecurityBoundary() {
  return (
    <figure className="flex flex-col gap-3 border border-border bg-card p-4">
      <svg
        viewBox="0 0 620 210"
        role="img"
        aria-label="Trust boundary diagram. The browser sends an instruction and parameters to the application's own route handler and receives normalized text and timing. The API Gateway invoke URL, the API key, and upstream response bodies stay on the server and never cross into the browser."
        className="w-full max-w-2xl"
      >
        <g fontFamily="var(--font-geist-mono), ui-monospace, monospace">
          <text x="20" y="20" fontSize="10" fill="var(--muted-foreground)">
            BROWSER
          </text>
          <text x="330" y="20" fontSize="10" fill="var(--muted-foreground)">
            SERVER
          </text>

          {/*
            The boundary, drawn in two segments. The gap is where the sanctioned
            crossing happens, so the arrows read as passing through a controlled
            opening rather than straight over the line.
          */}
          <line
            x1="310"
            y1="8"
            x2="310"
            y2="30"
            stroke="var(--signal-error)"
            strokeDasharray="3 4"
          />
          <line
            x1="310"
            y1="88"
            x2="310"
            y2="190"
            stroke="var(--signal-error)"
            strokeDasharray="3 4"
          />
          <text
            x="310"
            y="200"
            fontSize="9"
            textAnchor="middle"
            fill="var(--signal-error)"
          >
            trust boundary
          </text>

          <rect
            x="20"
            y="34"
            width="240"
            height="46"
            fill="var(--muted)"
            stroke="var(--border-strong)"
          />
          <text x="32" y="54" fontSize="11" fill="var(--foreground)">
            Console UI
          </text>
          <text x="32" y="70" fontSize="9" fill="var(--muted-foreground)">
            holds no credentials
          </text>

          <rect
            x="352"
            y="34"
            width="248"
            height="46"
            fill="var(--muted)"
            stroke="var(--border-strong)"
          />
          <text x="364" y="54" fontSize="11" fill="var(--foreground)">
            Route handler → AWS chain
          </text>
          <text x="364" y="70" fontSize="9" fill="var(--muted-foreground)">
            API Gateway · Lambda · SageMaker
          </text>

          {/* crossing: request */}
          <line x1="260" y1="50" x2="352" y2="50" stroke="var(--signal-ok)" />
          <path d="M352 50 l-8 -4 v8 z" fill="var(--signal-ok)" />
          <text x="306" y="42" fontSize="9" textAnchor="middle" fill="var(--signal-ok)">
            instruction, params
          </text>

          {/* crossing: response */}
          <line x1="352" y1="66" x2="260" y2="66" stroke="var(--signal-ok)" />
          <path d="M260 66 l8 -4 v8 z" fill="var(--signal-ok)" />
          <text x="306" y="80" fontSize="9" textAnchor="middle" fill="var(--signal-ok)">
            text, duration, status
          </text>

          {/* never crosses */}
          <text x="352" y="118" fontSize="10" fill="var(--signal-error)">
            never crosses
          </text>
          {[
            "API Gateway invoke URL",
            "API key",
            "upstream response body",
            "endpoint identifiers",
          ].map((label, i) => (
            <text
              key={label}
              x="364"
              y={136 + i * 15}
              fontSize="9"
              fill="var(--muted-foreground)"
            >
              · {label}
            </text>
          ))}
        </g>
      </svg>
      <figcaption className="text-[11px] leading-relaxed text-muted-foreground">
        Errors returned to the browser carry a code and a message only. Upstream
        bodies and diagnostics stay in the server log.
      </figcaption>
    </figure>
  );
}
