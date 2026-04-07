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
Filename: "{app}\medserv_agent.exe"; Parameters: "--email {code:GetEmail}"; Description: "Start MedServ Diagnostic Agent"; Flags: nowait postinstall skipifsilent

[Code]
var
  EmailPage: TInputQueryWizardPage;

procedure InitializeWizard;
begin
  { Create the custom page }
  EmailPage := CreateInputQueryPage(wpWelcome,
    'Security Agent Setup', 'Connect this device to your account',
    'Enter your work email address so IT can identify this computer and send you your security report.');
    
  { Add the input field }
  EmailPage.Add('Work email:', False);
  
  { Set default value for testing if needed, or leave blank }
  EmailPage.Values[0] := 'john.smith@company.com';
end;

function GetEmail(Param: string): string;
begin
  Result := EmailPage.Values[0];
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = EmailPage.ID then begin
    if (EmailPage.Values[0] = '') or (Pos('@', EmailPage.Values[0]) = 0) then begin
      MsgBox('Please enter a valid work email address.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

[Registry]
; Configure agent to run automatically silently on Startup for all users
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "MedServDiagnosticAgent"; ValueData: """{app}\medserv_agent.exe"""; Flags: uninsdeletevalue
