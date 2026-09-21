package com.jasonwu.firenfcreader;
import android.app.*; import android.os.*; import android.hardware.usb.*; import android.content.*; import android.graphics.Typeface; import android.view.*; import android.widget.*;
import com.hoho.android.usbserial.driver.*; import java.util.*;
public class MainActivity extends Activity {
 static final String ACT="com.jasonwu.firenfcreader.USB_PERMISSION"; TextView status,uid,diag; UsbSerialPort port; UsbManager mgr; volatile boolean running; Handler ui=new Handler(Looper.getMainLooper()); long polls,responses,lastResponse; int consecutiveMisses;
 static final byte[] WAKE={(byte)0x55,(byte)0x55,0,0,0};
 static final byte[] SAM={0,0,(byte)0xff,5,(byte)0xfb,(byte)0xd4,0x14,0x01,0x14,0x01,0x02,0};
 static final byte[] POLL={0,0,(byte)0xff,4,(byte)0xfc,(byte)0xd4,0x4a,0x01,0x00,(byte)0xe1,0};
 BroadcastReceiver rx=new BroadcastReceiver(){public void onReceive(Context c,Intent i){if(ACT.equals(i.getAction())){UsbDevice d=i.getParcelableExtra(UsbManager.EXTRA_DEVICE);if(i.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED,false)&&d!=null)connect(d);else msg("USB permission denied");}}};
 public void onCreate(Bundle b){super.onCreate(b); LinearLayout x=new LinearLayout(this);x.setOrientation(LinearLayout.VERTICAL);x.setPadding(36,55,36,30);
  TextView t=new TextView(this);t.setText("Fire NFC Reader — Diagnostics");t.setTextSize(26);t.setTypeface(null,Typeface.BOLD); status=new TextView(this);status.setTextSize(19);status.setPadding(0,30,0,20);uid=new TextView(this);uid.setTextSize(22);uid.setTypeface(Typeface.MONOSPACE,Typeface.BOLD);uid.setTextIsSelectable(true);
  diag=new TextView(this);diag.setTextSize(14);diag.setTypeface(Typeface.MONOSPACE,Typeface.NORMAL);diag.setTextIsSelectable(true);diag.setPadding(0,25,0,25);
  Button r=new Button(this);r.setText("Reconnect / Reinitialize");r.setOnClickListener(v->find());x.addView(t);x.addView(status);x.addView(uid);x.addView(diag);x.addView(r);setContentView(x);mgr=(UsbManager)getSystemService(USB_SERVICE);
  IntentFilter f=new IntentFilter(ACT);if(Build.VERSION.SDK_INT>=33)registerReceiver(rx,f,Context.RECEIVER_NOT_EXPORTED);else registerReceiver(rx,f);find();}
 void find(){running=false;try{if(port!=null)port.close();}catch(Exception e){} port=null; polls=responses=lastResponse=0;consecutiveMisses=0;msg("STATE: SEARCHING USB");dmsg("Looking for supported USB serial device...");
  List<UsbSerialDriver>d=UsbSerialProber.getDefaultProber().findAllDrivers(mgr);if(d.isEmpty()){msg("STATE: NO USB DEVICE");dmsg("No supported USB serial device found.\nConnect reader and tap Reconnect.");return;}UsbDevice u=d.get(0).getDevice();dmsg("USB device found\nVID:PID "+String.format(Locale.US,"%04X:%04X",u.getVendorId(),u.getProductId())+"\nDevice: "+u.getDeviceName()+"\nPermission: "+mgr.hasPermission(u));if(!mgr.hasPermission(u)){msg("STATE: WAITING FOR USB PERMISSION");PendingIntent p=PendingIntent.getBroadcast(this,0,new Intent(ACT),Build.VERSION.SDK_INT>=31?PendingIntent.FLAG_MUTABLE:0);mgr.requestPermission(u,p);}else connect(u);}
 void connect(UsbDevice d){try{UsbSerialDriver q=null;for(UsbSerialDriver z:UsbSerialProber.getDefaultProber().findAllDrivers(mgr))if(z.getDevice().getDeviceId()==d.getDeviceId())q=z;if(q==null)throw new Exception("serial driver not found");port=q.getPorts().get(0);port.open(mgr.openDevice(d));port.setParameters(115200,8,UsbSerialPort.STOPBITS_1,UsbSerialPort.PARITY_NONE);running=true;msg("STATE: USB SERIAL OPEN\nInitializing PN532...");dmsg("CH34x/serial: OPEN\n115200 baud, 8N1\nStarting PN532 wake + SAM configuration...");new Thread(this::loop).start();}catch(Exception e){msg("STATE: USB CONNECTION ERROR");dmsg(e.toString());}}
 void loop(){try{port.write(WAKE,1000);Thread.sleep(100);byte[]w=read(150);port.write(SAM,1000);Thread.sleep(100);byte[]sam=read(350);boolean pn=contains(sam,0xd5,0x15);msg(pn?"STATE: PN532 RESPONDING\nScanning for NFC tags...":"STATE: PN532 RESPONSE NOT VERIFIED\nPolling anyway...");
   dmsg("Wake RX: "+hex(w)+"\nSAM RX: "+hex(sam)+"\nPN532 SAM response: "+(pn?"YES":"NO"));
   while(running){drain();port.write(POLL,1000);polls++;byte[]a=read(350);String id=parse(a);if(a.length>0){responses++;lastResponse=System.currentTimeMillis();consecutiveMisses=0;}else consecutiveMisses++;
    String state=id!=null?"TAG DETECTED":(a.length>0?"PN532 ALIVE — NO TAG":"NO RESPONSE FROM READER");
    if(id!=null){String s=id;ui.post(()->uid.setText("UID: "+s));}
    dmsg("STATE: "+state+"\nPolls sent: "+polls+"\nPolls with RX data: "+responses+"\nConsecutive empty RX: "+consecutiveMisses+"\nLast RX bytes: "+a.length+"\nLast RX: "+hex(a)+"\nLast response: "+(lastResponse==0?"never":((System.currentTimeMillis()-lastResponse)+" ms ago"))+(id!=null?"\nLast tag UID: "+id:""));
    Thread.sleep(id!=null?500:120);
   }}catch(Exception e){msg("STATE: PN532 COMMUNICATION ERROR");dmsg(e.toString());}}
 byte[] read(int wait)throws Exception{long end=System.currentTimeMillis()+wait;java.io.ByteArrayOutputStream o=new java.io.ByteArrayOutputStream();byte[]b=new byte[256];while(System.currentTimeMillis()<end){int n=port.read(b,60);if(n>0)o.write(b,0,n);}return o.toByteArray();}
 void drain(){try{byte[]b=new byte[256];while(port.read(b,20)>0){}}catch(Exception e){}}
 boolean contains(byte[]a,int x,int y){for(int i=0;i+1<a.length;i++)if((a[i]&255)==x&&(a[i+1]&255)==y)return true;return false;}
 String hex(byte[]a){if(a==null||a.length==0)return "(none)";StringBuilder s=new StringBuilder();int n=Math.min(a.length,80);for(int i=0;i<n;i++){if(i>0)s.append(' ');s.append(String.format(Locale.US,"%02X",a[i]&255));}if(a.length>n)s.append(" ...");return s.toString();}
 String parse(byte[]a){for(int i=0;i+10<a.length;i++)if((a[i]&255)==0xd5&&(a[i+1]&255)==0x4b&&(a[i+2]&255)>=1){int p=i+3;p++;p+=2;p++;if(p>=a.length)continue;int n=a[p++]&255;if(n<4||n>10||p+n>a.length)continue;StringBuilder s=new StringBuilder();for(int k=0;k<n;k++){if(k>0)s.append(':');s.append(String.format(Locale.US,"%02X",a[p+k]&255));}return s.toString();}return null;}
 void msg(String s){ui.post(()->status.setText(s));} void dmsg(String s){ui.post(()->diag.setText(s));}
 protected void onDestroy(){running=false;try{if(port!=null)port.close();}catch(Exception e){}unregisterReceiver(rx);super.onDestroy();}
}