import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * ErrorBoundary — fallback error UI using design tokens.
 * All color values reference CSS custom properties from tokens.css.
 *
 * Requirements: 1.4
 */

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--surface-ground, #f7f5f2)' }}
        >
          <div
            className="max-w-md w-full text-center space-y-6 p-8 rounded-[var(--radius-lg,1rem)]"
            style={{
              backgroundColor: 'var(--surface-raised, #ffffff)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <AlertTriangle
              className="size-16 mx-auto"
              style={{ color: 'var(--accent-danger, #dc2626)' }}
            />

            <div className="space-y-2">
              <h1
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary, #1a1714)' }}
              >
                Something went wrong
              </h1>
              <p style={{ color: 'var(--text-secondary, #3d3830)' }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details
                className="text-left text-xs p-4 rounded-[var(--radius-md,0.75rem)] overflow-auto max-h-48"
                style={{ backgroundColor: 'var(--surface-sunken, #f0ede8)' }}
              >
                <summary
                  className="cursor-pointer font-semibold mb-2"
                  style={{ color: 'var(--text-primary, #1a1714)' }}
                >
                  Error Details (Development Only)
                </summary>
                <pre
                  className="whitespace-pre-wrap"
                  style={{ color: 'var(--accent-danger, #dc2626)' }}
                >
                  {this.state.error?.stack}
                </pre>
                <pre
                  className="whitespace-pre-wrap mt-2"
                  style={{ color: 'var(--text-secondary, #3d3830)' }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
