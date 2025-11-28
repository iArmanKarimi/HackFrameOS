/**
 * ErrorBoundary Component
 * React Error Boundary for graceful error handling
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { STYLE_COLORS } from "../styles/terminalStyles";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary to catch and handle React component errors
 * Provides user-friendly error messages and recovery options
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div
					style={{
						width: "100vw",
						height: "100vh",
						backgroundColor: STYLE_COLORS.BACKGROUND_DARK,
						color: "#ff4444",
						fontFamily: "monospace",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						padding: "2rem",
					}}
				>
					<h1 style={{ margin: 0, marginBottom: "1rem" }}>
						[ERROR] System Failure
					</h1>
					<p style={{ margin: 0, opacity: 0.8 }}>
						{this.state.error?.message || "An unexpected error occurred"}
					</p>
					<button
						onClick={() => window.location.reload()}
						style={{
							marginTop: "2rem",
							padding: "0.5rem 1rem",
							backgroundColor: "#ff4444",
							color: "#ffffff",
							border: "none",
							cursor: "pointer",
							fontFamily: "monospace",
						}}
					>
						Restart System
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
