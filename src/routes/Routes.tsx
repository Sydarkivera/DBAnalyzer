import { Router } from "src/lib/electron-router-dom";
import { Route } from "react-router-dom";
import React from "react";

export function Routes() {
  return (
    <Router
      main={
        <>
          <Route index element={<DBSelectScreen />} />
          <Route path="database" element={<Database />}>
            <Route path="table" element={<TablePreviewScreen />} />
            <Route path="verification" element={<TableVerificationScreen />} />
          </Route>
        </>
      }
    />
  )
}