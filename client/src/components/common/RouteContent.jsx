import { Component, Suspense, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/routeContent.css";
import { applyAppZoom, getAppZoom } from "../../utils/appZoom.js";

class RouteErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        console.error("Page failed to load:", error);
    }

    componentDidUpdate(previousProps) {
        if (this.state.failed && previousProps.path !== this.props.path) {
            this.setState({ failed: false });
        }
    }

    render() {
        if (this.state.failed) {
            return (
                <section className="route-feedback" role="alert">
                    <h2>Unable to open this page</h2>
                    <p>Reload to try again, or choose another page from navigation.</p>
                    <button type="button" onClick={() => window.location.reload()}>
                        Reload page
                    </button>
                </section>
            );
        }
        return this.props.children;
    }
}

export default function RouteContent({ children }) {
    const { pathname } = useLocation();
    useLayoutEffect(() => {
        applyAppZoom(getAppZoom());
    }, [pathname]);
    return (
        <RouteErrorBoundary path={pathname}>
            <Suspense fallback={<div className="route-feedback" role="status" aria-live="polite">Loading page…</div>}>
                {children}
            </Suspense>
        </RouteErrorBoundary>
    );
}
