import "@contentstack/venus-components/build/main.css";

import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { CustomFieldExtensionProvider } from "../../common/providers/CustomFieldExtensionProvider";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MarketplaceAppProvider } from "../../common/providers/MarketplaceAppProvider";

/**
 * All the routes are Lazy loaded.
 * This will ensure the bundle contains only the core code and respective route bundle
 * improving the page load time
 */
const CustomFieldExtension = React.lazy(
  () => import("../CustomField/CustomField")
);

const PageNotFound = React.lazy(() => import("../404/404"));
const DefaultPage = React.lazy(() => import("../index"));

function App() {
  return (
    <ErrorBoundary>
      <MarketplaceAppProvider excludeRoutes={["/"]}>
        <Routes>
          <Route path="/" element={<DefaultPage />} />
          <Route
            path="/custom-field"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldExtension />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </MarketplaceAppProvider>
    </ErrorBoundary>
  );
}

export default App;
