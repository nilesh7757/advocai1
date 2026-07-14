import os

analyzer_path = "D:/advocai1/frontend/src/pages/DocumentAnalyzer.jsx"

with open(analyzer_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Locate {!hasAnalysis ? (
start_idx = content.find("        {!hasAnalysis ? (")
if start_idx == -1:
    print("Error: Could not find {!hasAnalysis ? (")
    exit(1)

# Locate the corresponding ) : (
# Since we know the block structure, we can search for the end of the upload container.
# The end of the upload container is:
#             </div>
#           </div>
#         ) : (
#           // Redesigned Active Workspace
#           <>
#             {/* Header row */}

end_target = """            </div>
          </div>
        ) : ("""

end_idx = content.find(end_target, start_idx)
if end_idx == -1:
    print("Error: Could not find end target")
    exit(1)

end_idx += len(end_target)

# Now, we construct the replacement content:
replacement = """        {!hasAnalysis && !compareResult ? (
          // Center Empty State / Upload Container
          <div className="w-full max-w-2xl mx-auto p-6 lg:p-12 flex-grow flex flex-col items-center justify-center space-y-8 animate-fade-in-up relative">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 z-40 p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground md:hidden cursor-pointer shadow-sm animate-fade-in"
                title="Open history"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            <div className="text-center space-y-2 select-none">
              <h1 className="text-3xl font-bold text-foreground">AI Document Analyzer</h1>
              <p className="text-sm text-muted-foreground">Upload legal documents for instant review, semantic analysis, and risk detection</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-muted p-1 rounded-lg select-none w-64 mx-auto animate-fade-in">
              <button
                onClick={() => {
                  setAnalyzerMode('single');
                  setCompareResult(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
                  analyzerMode === 'single'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Single Document
              </button>
              <button
                onClick={() => {
                  setAnalyzerMode('compare');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
                  analyzerMode === 'compare'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Compare Two Versions
              </button>
            </div>

            {analyzerMode === 'compare' ? (
              <div className="flex flex-col gap-6 w-full animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Document A Dropzone */}
                  <div
                    className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center cursor-pointer select-none ${
                      fileA ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/50 bg-card'
                    }`}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.docx,.txt';
                      input.onchange = (e) => {
                        const file = e.target.files?.[0];
                        if (file) setFileA(file);
                      };
                      input.click();
                    }}
                  >
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 flex items-center justify-center w-12 h-12 mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Original Document (Version A)</p>
                        <p className="text-xs text-muted-foreground">Click to browse file</p>
                      </div>
                      {fileA ? (
                        <div className="p-2 rounded bg-muted text-xs font-medium text-foreground truncate max-w-xs mx-auto border border-border">
                          {fileA.name}
                        </div>
                      ) : (
                        <div className="h-8" />
                      )}
                    </div>
                  </div>

                  {/* Document B Dropzone */}
                  <div
                    className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center cursor-pointer select-none ${
                      fileB ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/50 bg-card'
                    }`}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.docx,.txt';
                      input.onchange = (e) => {
                        const file = e.target.files?.[0];
                        if (file) setFileB(file);
                      };
                      input.click();
                    }}
                  >
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 flex items-center justify-center w-12 h-12 mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">New/Counter-Offer (Version B)</p>
                        <p className="text-xs text-muted-foreground">Click to browse file</p>
                      </div>
                      {fileB ? (
                        <div className="p-2 rounded bg-muted text-xs font-medium text-foreground truncate max-w-xs mx-auto border border-border">
                          {fileB.name}
                        </div>
                      ) : (
                        <div className="h-8" />
                      )}
                    </div>
                  </div>
                </div>

                {fileA && fileB && (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <button
                      onClick={handleCompareDocuments}
                      disabled={comparing}
                      className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2"
                    >
                      {comparing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Comparing Documents...</span>
                        </>
                      ) : (
                        <span>Compare Documents</span>
                      )}
                    </button>
                    {compareError && <p className="text-xs text-destructive">{compareError}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 w-full ${
                  dragActive 
                    ? 'border-primary bg-primary/10 scale-[1.02]' 
                    : selectedFiles.length > 0 
                      ? 'border-primary/50 bg-card' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50 bg-card'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={(e) => {
                  if (uploading) return;
                  if (selectedFiles.length === 0 && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleSelectFiles(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                  multiple
                />

                <div className="p-8 sm:p-10 lg:p-12 text-center select-none">
                  {uploading ? (
                    <div className="space-y-4">
                      <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                      <div>
                        <p className="text-base font-semibold text-foreground mb-1">Analyzing documents...</p>
                        <p className="text-xs text-muted-foreground">Extracting clauses and measuring liabilities</p>
                      </div>
                    </div>
                  ) : selectedFiles.length > 0 ? (
                    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
                      <div className="text-left space-y-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Selected Files ({selectedFiles.length})</p>
                        <div className="space-y-1.5">
                          {selectedFiles.map((file, idx) => (
                            <div 
                              key={`${file.name}-${idx}`}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="font-medium text-foreground truncate">{file.name}</span>
                                <span className="text-[10px] text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <button
                                onClick={() => handleRemoveFile(idx)}
                                className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                                title="Remove File"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          className="px-4 py-2 border border-border hover:bg-muted text-foreground rounded-lg font-medium text-xs transition-all cursor-pointer"
                        >
                          Add Files
                        </button>
                        <button
                          onClick={handleAnalyzeDocuments}
                          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-xs shadow-sm transition-all cursor-pointer"
                        >
                          Analyze Documents
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 cursor-pointer">
                      <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20 flex items-center justify-center w-16 h-16 mx-auto">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground mb-1">Drag and drop your documents here</p>
                        <p className="text-xs text-muted-foreground mb-4">or click to browse your files</p>
                        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                          <span>Supports:</span>
                          <span className="px-2 py-0.5 bg-muted border border-border rounded font-mono">PDF</span>
                          <span className="px-2 py-0.5 bg-muted border border-border rounded font-mono">DOCX</span>
                          <span className="px-2 py-0.5 bg-muted border border-border rounded font-mono">TXT</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="m-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                    <p className="text-destructive text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3 supporting core feature calls */}
            <div className="grid grid-cols-3 gap-6 w-full pt-4 border-t border-border">
              <div className="text-center space-y-1">
                <div className="text-primary font-semibold text-sm flex items-center justify-center gap-1 select-none">
                  <span>✓</span> Instant Analysis
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">Parse clauses and terms in seconds</p>
              </div>
              <div className="text-center space-y-1">
                <div className="text-primary font-semibold text-sm flex items-center justify-center gap-1 select-none">
                  <span>✓</span> Risk Detection
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">Unmask unfavorable and missing terms</p>
              </div>
              <div className="text-center space-y-1">
                <div className="text-primary font-semibold text-sm flex items-center justify-center gap-1 select-none">
                  <span>✓</span> Plain English
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">Deconstruct legalese into readable notes</p>
              </div>
            </div>
          </div>
        ) : compareResult ? (
          // Compare Results Workspace
          <div className="flex-grow flex flex-col h-full overflow-hidden bg-background">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0 bg-card select-none">
              <div>
                <h2 className="text-base font-bold text-foreground">Document Comparison Report</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparing <span className="font-semibold text-foreground">{fileA?.name}</span> to{' '}
                  <span className="font-semibold text-foreground">{fileB?.name}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  compareResult.overall_verdict === 'risk increased'
                    ? 'bg-destructive/10 text-destructive'
                    : compareResult.overall_verdict === 'risk decreased'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  Overall: {compareResult.overall_verdict === 'risk increased' ? 'Risk Increased' : compareResult.overall_verdict === 'risk decreased' ? 'Risk Decreased' : 'Neutral'}
                </span>
                <button
                  onClick={() => {
                    setCompareResult(null);
                    setFileA(null);
                    setFileB(null);
                  }}
                  className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-xs transition-all cursor-pointer"
                >
                  New Comparison
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-muted/5">
              <div className="max-w-4xl mx-auto space-y-4">
                {compareResult.diff_sections.map((section, idx) => {
                  let borderClass = 'border-border bg-card';
                  let badge = null;
                  
                  if (section.type === 'added') {
                    borderClass = 'border-primary/30 bg-primary/5';
                  } else if (section.type === 'removed') {
                    borderClass = 'border-destructive/30 bg-destructive/5';
                  } else if (section.type === 'modified') {
                    borderClass = 'border-yellow-500/30 bg-yellow-500/5';
                  }

                  if (section.risk_verdict === 'risk increased') {
                    badge = (
                      <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
                        Risk Increased
                      </span>
                    );
                  } else if (section.risk_verdict === 'risk decreased') {
                    badge = (
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
                        Risk Decreased
                      </span>
                    );
                  } else {
                    badge = (
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-bold uppercase">
                        Neutral
                      </span>
                    );
                  }

                  return (
                    <div key={idx} className={`p-4 border rounded-xl shadow-sm ${borderClass} flex flex-col gap-3 transition-all`}>
                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                          Section {idx + 1} • {section.type}
                        </span>
                        <div className="flex items-center gap-2">
                          {badge}
                        </div>
                      </div>

                      {section.type === 'modified' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Original text:</span>
                            <p className="text-xs text-muted-foreground/80 line-through select-text font-serif leading-relaxed italic bg-destructive/5 p-2 rounded">
                              {section.text_a}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-primary uppercase">New text:</span>
                            <p className="text-xs text-foreground select-text font-serif leading-relaxed bg-primary/5 p-2 rounded">
                              {section.text_b}
                            </p>
                          </div>
                        </div>
                      ) : section.type === 'removed' ? (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-destructive uppercase">Removed clause:</span>
                          <p className="text-xs text-muted-foreground/80 line-through select-text font-serif leading-relaxed italic bg-destructive/5 p-2 rounded">
                            {section.text_a}
                          </p>
                        </div>
                      ) : section.type === 'added' ? (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-primary uppercase">Added clause:</span>
                          <p className="text-xs text-foreground select-text font-serif leading-relaxed bg-primary/5 p-2 rounded">
                            {section.text_b}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-foreground/90 select-text font-serif leading-relaxed">
                          {section.text_a}
                        </p>
                      )}

                      {section.risk_explanation && (
                        <div className="mt-1 text-xs text-muted-foreground border-t border-border/20 pt-2 select-text font-sans">
                          <span className="font-semibold block text-[10px] text-foreground uppercase tracking-wide">Analysis:</span>
                          {section.risk_explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : ("""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open(analyzer_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced!")
