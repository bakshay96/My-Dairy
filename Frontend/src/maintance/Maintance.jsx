import React from "react";

export default function Maintance() {
	return (
		<>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "20px 20px",
				}}
			>
				<div>
					<marquee
						style={{ color: "red", fontWeight: "500", fontSize: "20px" }}
						behavior="scroll"
						direction="left"
					>
						We are Undert Maintenance.. Will be back soon..!
					</marquee>
					{/* <iframe style={{height:"50vh",maxWidth:"100%",backgroundColor:"teal", borderRadius:"10%", padding:"20px"}} loading="lazy" src="https:/lottie.host/embed/347af893-dc55-4d98-a020-810877bc644e/JVVfcTs910.json"></iframe> */}
					<img
          style={{height:"50vh",maxWidth:"100%",backgroundColor:"teal", borderRadius:"10%", padding:"10px"}}
						src="https://cdn.dribbble.com/users/117876/screenshots/531193/media/1cc52d51f192d71e89537c28b8e204d6.gif"
						alt=""
					/>
				</div>
			</div>
		</>
	);
}
