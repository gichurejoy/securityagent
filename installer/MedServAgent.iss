[Setup]
AppName=MedServ Diagnostic Agent
AppVersion=1.0.0
DefaultDirName={autopf}\MedServDiagnostic
DefaultGroupName=MedServ Diagnostic
UninstallDisplayIcon={app}\medserv_agent.exe
Compression=lzma2
SolidCompression=yes
OutputDir=userdocs:Inno Setup Output
OutputBaseFilename=MedServAgentInstaller
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
Source: "..\dist\medserv_agent.exe"; DestDir: "{app}"; Flags: ignoreversion
; Note: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\MedServ Diagnostic Agent"; Filename: "{app}\medserv_agent.exe"

[Run]
Filename: "{app}\medserv_agent.exe"; Description: "Start MedServ Diagnostic Agent"; Flags: nowait postinstall skipifsilent

[Registry]
; Configure agent to run automatically silently on Startup for all users
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "MedServDiagnosticAgent"; ValueData: """{app}\medserv_agent.exe"""; Flags: uninsdeletevalue
